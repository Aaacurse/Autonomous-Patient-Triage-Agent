import re
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select,desc
from sqlalchemy.orm import selectinload
from app.db.sessions import get_db
from app.db.models import TriageSession,TriageRecord
from app.api.auth import get_current_user
from app.db.models import User
from app.db.crud import get_sessions_with_record,get_user_sessions,get_triages_by_mrn

router=APIRouter(prefix='/triage',tags=['triage'])

MRN_PATTERN = re.compile(r"^MRN-\d{4,}$", re.IGNORECASE)

@router.get("/sessions/by-mrn/{mrn}")
async def get_sessions_by_mrn(mrn:str,db:AsyncSession=Depends(get_db),current_user:User=Depends(get_current_user)):
    mrn=mrn.strip().upper()
    
    
    if not MRN_PATTERN.match(mrn):
        raise HTTPException(status_code=400,detail="Enter a complete MRN to search, e.g. MRN-00123")
    triages= await get_triages_by_mrn(db=db,mrn=mrn)
    
    return [
        {
            "session_id": str(s.id),
            "mrn": s.mrn,
            "status": s.status,
            "created_at": s.created_at.isoformat(),
            "record": {
                "raw_complaint": s.record.raw_complaint,
                "esi_level": s.record.esi_level,
                "disposition_zone": s.record.disposition_zone,
                "escalated": s.record.escalated,
            } if s.record else None,
        }
        for s in triages
    ]


@router.get("/sessions")
async def get_sessions(db:AsyncSession=Depends(get_db),current_user:User=Depends(get_current_user)):
    sessions= await get_user_sessions(db,current_user.id)
    
    return [
        {"session_id":str(s.id),
        "mrn":s.mrn,
        "status":s.status,
        "created_at":s.created_at.isoformat() 
        }
        for s in sessions
    ]
    
@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id:str,
    db:AsyncSession=Depends(get_db),
    current_user:User=Depends(get_current_user)
):
    session=await get_sessions_with_record(db,session_id)
    
    if not session:
        raise HTTPException(status_code=404,detail="Session not found")
    
    if session.nurse_id!=current_user.id:
        raise HTTPException(status_code=403,detail="Not your Session")
    
    record=session.record
    
    return {
        "session_id": str(session.id),
        "mrn": session.mrn,
        "status": session.status,
        "created_at": session.created_at.isoformat(),
        "record": {
            "raw_complaint": record.raw_complaint,
            "extracted_symptoms": record.extracted_symptoms,
            "pain_score": record.pain_score,
            "esi_level": record.esi_level,
            "esi_reasoning": record.esi_reasoning,
            "disposition_zone": record.disposition_zone,
            "escalated": record.escalated,
            "life_threat": record.life_threat,
            "high_risk": record.high_risk,
            "estimated_resources": record.estimated_resources,
        } if record else None,
    }