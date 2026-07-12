import re
import en_core_sci_sm   # type: ignore
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.db.crud import get_triages_by_mrn
from pydantic import BaseModel,Field
from sqlalchemy.ext.asyncio import AsyncSession

nlp=en_core_sci_sm.load()

llm=ChatGroq(
    api_key=settings.groq_api_key,
    model=settings.groq_model,
    temperature=0.1
)

class NLPExtractionOutput(BaseModel):
    symptoms: list[str] = Field(description="List of symptoms extracted from complaint")
    is_life_threat: bool = Field(description="True if airway/breathing/circulation is compromised or patient is unresponsive")
    is_high_risk: bool = Field(description="True if severe pain 7+, altered mental status, or high-risk presentation")
    estimated_resources: list[str] = Field(description="ED resources needed: labs, imaging, iv_medication, consult")
    danger_zone_vitals: bool = Field(description="True if any vitals are in danger zone")
    clinical_notes: str = Field(description="One sentence clinical summary")
    inferred_pain_score: int = Field(description="Pain score 0-10 inferred from description. 0=none, 1-3=mild, 4-6=moderate, 7-9=severe, 10=worst possible. Use qualitative words if no numeric score given.")
    repeat_high_acuity_visit:bool=Field(description="True only if patient triage history was provided AND it shows a prior ESI 1 or 2 visit, or a pattern of escalating severity relevant to the current complaint. Must be false if no history was provided.")

structured_llm = llm.with_structured_output(NLPExtractionOutput)


HISTORY_TOOL_SCHEMA={
    'type':'function',
    'function':{
        "name":"lookup_patient_history",
        "description":(
            """Look up this patient's prior ED triage visits by MRN. Call this only when the complaint suggests a recurring or chronic issue references a prior visit, or when knowing past ESI levels could materially change the urgency assessment. Do not call for a routine, apparently first-time complaint."""
        ),
        "parameters":{'type':"object","properties":{}},
    }
}

llm_with_tool=llm.bind_tools([HISTORY_TOOL_SCHEMA])


def extract_entities(text:str)->dict:
    doc=nlp(text)
    
    entities=[]
    for ent in doc.ents:
        entities.append({
            "text":ent.text,
            "label":ent.label,
            "start":ent.start_char,
            "end":ent.end_char
        })
    
    return {
        "entities":entities,
        "tokens":[token.text for token in doc],
    }
    
def extract_pain_score(text:str)->int|None:
    patterns = [
        r'\b(\d{1,2})\s*/\s*10\b',           # 8/10
        r'\bpain\s+(?:score\s+)?(\d{1,2})\b', # pain 8, pain score 8
        r'\bseverity\s+(\d{1,2})\b',           # severity 8
        r'\b(\d{1,2})\s+out\s+of\s+10\b',     # 8 out of 10
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            score = int(match.group(1))
            if 0 <= score <= 10:
                return score

    return None

async def maybe_fetch_patient_history(complaint: str, db, mrn: str) -> tuple[str | None, bool]:
    """
    Let the model decide whether this patient's prior triage history is
    relevant. If it chooses to call the tool, fetch history from the DB.
    Returns (summary_text_or_None, repeat_high_acuity_visit).
    repeat_high_acuity_visit is computed directly from the DB data, not
    inferred by the LLM, since that's a factual check, not a judgment call.
    """
    decision_prompt = (
        f'Patient complaint: "{complaint}"\n\n'
        "Decide whether looking up this patient's prior triage history would "
        "materially change the urgency assessment. Only call "
        "lookup_patient_history if the complaint suggests a recurring/chronic "
        "issue, a prior similar visit, or an escalation pattern worth "
        "checking. Otherwise, do not call any tool."
    )

    response = await llm_with_tool.ainvoke([HumanMessage(content=decision_prompt)])

    if not response.tool_calls:
        return None, False

    sessions = await get_triages_by_mrn(db, mrn)
    if not sessions:
        return "No prior triage visits found for this MRN.", False

    lines = []
    repeat_high_acuity_visit = False
    for s in sessions[:5]:
        if s.record:
            lines.append(
                f"- {s.created_at.date()}: ESI {s.record.esi_level}, "
                f"complaint: {s.record.raw_complaint!r}, escalated={s.record.escalated}"
            )
            if s.record.esi_level in (1, 2):
                repeat_high_acuity_visit = True

    if not lines:
        return "Prior visits exist but have no recorded ESI data yet.", False

    summary = "Prior visits for this patient:\n" + "\n".join(lines)
    return summary, repeat_high_acuity_visit

    
    
async def groom_with_groq(complaint: str, scispacy_entities: list[dict],history_summary:str|None=None) -> NLPExtractionOutput:
    entity_text = ", ".join([e["text"] for e in scispacy_entities]) or "none detected"

    prompt = f"""You are a clinical triage assistant. Analyze the patient complaint and extracted medical entities.

Patient complaint: "{complaint}"
scispaCy extracted entities: {entity_text}

Rules:
- is_life_threat = true only if airway/breathing/circulation is compromised or patient is unresponsive
- is_high_risk = true if severe pain 7+, altered mental status, or high-risk presentation
- estimated_resources = only what an ED would realistically need: labs, imaging, iv_medication, consult
- danger_zone_vitals = true if HR > 120, RR > 20, SpO2 < 92%, temp > 104F or < 96F
- inferred_pain_score = estimate 0-10 from qualitative words if no numeric score:
    - "mild", "dull", "slight" = 2-3
    - "moderate", "uncomfortable", "sore" = 4-5
    - "sharp", "bad", "significant" = 5-6
    - "severe", "intense", "awful" = 7-8
    - "excruciating", "worst ever", "unbearable" = 9-10
    - no pain mentioned = 0
- repeat_high_acuity_visit = true only if patient triage history above shows a prior ESI 1 or 2 visit, or an escalating pattern relevant to this complaint. Must be false if no history was provided above.
"""

    result: NLPExtractionOutput =await structured_llm.ainvoke(prompt)
    return result