from typing import TypedDict, Optional, Literal


class TriageState(TypedDict, total=False):
    session_id: str
    mrn: str
    raw_complaint: str
    reported_vitals: Optional[dict]

    extracted_symptoms: list[str]
    extracted_entities: dict
    pain_score: Optional[int]
    patient_history_checked: bool
    repeat_high_acuity_visit: bool

    groq_is_life_threat: bool
    groq_is_high_risk: bool
    groq_estimated_resources: list[str]
    groq_danger_zone_vitals: bool

    life_threat: bool
    high_risk: bool
    estimated_resources: list[str]
    danger_zone_vitals: bool
    esi_level: Optional[Literal[1, 2, 3, 4, 5]]
    esi_reasoning: str

    disposition_zone: Optional[str]
    escalated: bool

    last_node: str
    error: Optional[str]
