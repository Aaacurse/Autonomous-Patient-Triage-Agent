import re
import en_core_sci_sm
from langchain_groq import ChatGroq
from app.core.config import settings
from pydantic import BaseModel,Field

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

structured_llm = llm.with_structured_output(NLPExtractionOutput)


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

def groom_with_groq(complaint: str, scispacy_entities: list[dict]) -> NLPExtractionOutput:
    entity_text = ", ".join([e["text"] for e in scispacy_entities]) or "none detected"

    prompt = f"""You are a clinical triage assistant. Analyze the patient complaint and extracted medical entities.

Patient complaint: "{complaint}"
scispaCy extracted entities: {entity_text}

Rules:
- is_life_threat = true only if airway/breathing/circulation is compromised or patient is unresponsive
- is_high_risk = true if severe pain 7+, altered mental status, or high-risk presentation  
- estimated_resources = only what an ED would realistically need: labs, imaging, iv_medication, consult
- danger_zone_vitals = true if HR > 120, RR > 20, SpO2 < 92%, temp > 104F or < 96F
"""

    result: NLPExtractionOutput = structured_llm.invoke(prompt)
    return result