from langchain_core.runnables import RunnableConfig
from app.agent.state import TriageState
from app.agent.nlp import (extract_entities,extract_pain_score,groom_with_groq,maybe_fetch_patient_history)

async def intake_node(state:TriageState)->TriageState:
    raw=state.get('raw_complaint',"").strip()
    
    if not raw:
        return{
            **state,
            "last_node":"intake",
            "error":"Empty complaint recieved"
        }
        
    return{
        **state,
        "last_node":"intake",
        "raw_complaint":raw.lower(),
        "error":None
    }
    
    
async def nlp_extract_node(state:TriageState,config:RunnableConfig)->TriageState:
    complaint=state.get("raw_complaint","")
    mrn=state.get("mrn")
    db=(config or {}).get("configurable",{}).get("db")
    
    scispacy_output = extract_entities(complaint)
    entities = scispacy_output["entities"]
    
    pain_score = extract_pain_score(complaint)
    
    hhistory_summary=None
    repeat_high_acuity_visit=False
    if db and mrn:
        history_summary, repeat_high_acuity_visit = await maybe_fetch_patient_history(complaint, db, mrn)

    groq_output = await groom_with_groq(complaint, entities, history_summary)

    if pain_score is None:
        pain_score = groq_output.inferred_pain_score
    
    return {
        **state,
        "last_node": "nlp_extract",
        "extracted_symptoms": groq_output.symptoms,
        "extracted_entities": {
            "scispacy": entities,
            "groq_clinical_notes": groq_output.clinical_notes,
        },
        "pain_score": pain_score or 0,
        "groq_is_life_threat": groq_output.is_life_threat,
        "groq_is_high_risk": groq_output.is_high_risk,
        "groq_estimated_resources": groq_output.estimated_resources,
        "groq_danger_zone_vitals": groq_output.danger_zone_vitals,
        "patient_history_checked":history_summary is not None,
        "repeat_high_acuity_visit": repeat_high_acuity_visit,
    }
    
    
async def esi_scorer_node(state:TriageState)->TriageState:
    pain_score = state.get("pain_score", 0)
    symptoms = state.get("extracted_symptoms", [])

    life_threat = state.get("groq_is_life_threat", False)
    high_risk = state.get("groq_is_high_risk", False)
    estimated_resources = state.get("groq_estimated_resources", [])
    danger_zone_vitals = state.get("groq_danger_zone_vitals", False)
    repeat_high_acuity_visit=state.get("repeat_high_acuity_visit",False)

    if pain_score >= 9:
        life_threat = True
    elif pain_score >= 7 and not life_threat:
        high_risk = True

    if life_threat:
        esi_level = 1
    elif high_risk:
        esi_level = 2
    elif len(estimated_resources) >= 2:
        esi_level = 3
    elif len(estimated_resources) == 1:
        esi_level = 4
    else:
        esi_level = 5

    return {
        **state,
        "last_node": "esi_scorer",
        "life_threat": life_threat,
        "high_risk": high_risk,
        "estimated_resources": estimated_resources,
        "danger_zone_vitals": danger_zone_vitals,
        "esi_level": esi_level,
       "esi_reasoning": (
            f"pain={pain_score}, life_threat={life_threat}, "
            f"high_risk={high_risk}, resources={estimated_resources}, "
            f"repeat_high_acuity_visit={repeat_high_acuity_visit}"
        ),
    }
    
    
async def escalate_node(state:TriageState)->TriageState:
    return{
        **state,
        "last_node":'escalate',
        "disposition_zone":"resuscitation_bay",
        "escalated":True
    }
    
    
async def disposition_node(state:TriageState)->TriageState:
    esi=state.get('esi_level')
    
    routing={
        2:"immediate_care",
        3:"acute_care",
        4:"fast_track",
        5:"waiting_room"
    }
    
    return{
        **state,
        "last_node":"disposition",
        "disposition_zone":routing.get(esi,'waiting_room'),
        "escalated":False
        
    }