import json
from datetime import datetime,UTC
from uuid import uuid4
from fastapi import APIRouter,WebSocket,WebSocketDisconnect,Depends,Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.sessions import get_db
from app.db.models import TriageRecord,TriageSession,SessionStatus
from app.db.crud import get_user_by_email
from app.core.security import decode_token
from app.agent.graph import triage_graph


router=APIRouter()

def make_event(event:str,node:str=None,data:dict=None)->str:
    return json.dumps({
      "event":event,
      "node":node,
      "data":data or {},
      "timestamp":datetime.now(UTC).isoformat()  
    })
    
async def get_user_from_token(token:str,db:AsyncSession):
    try:
        email=decode_token(token,"access")
    except ValueError:
        return None
    
    return await get_user_by_email(db=db,email=email)


@router.websocket('/ws/triage')
async def triage_websocket(
    websocket: WebSocket,
    token: str = Query(),
    db: AsyncSession = Depends(get_db)
):
    print(f"Token received: {token[:30]}...")
    user = await get_user_from_token(token=token, db=db)
    print(f"User found: {user}")

    if not user:
        await websocket.close(code=4001)
        return
    
    await websocket.accept()
    
    try:
        raw_message= await websocket.receive_text()
        message=json.loads(raw_message)
        
        complaint=message.get("complaint","").strip()
        patient_id=message.get("patient_id",f"patient-{uuid4().hex[:8]}")
        
        if not complaint:
            await websocket.send_text(make_event("error",data={"detail":"Empty Complaint"}))
            await websocket.close()
            return
        
        session=TriageSession(
            nurse_id=user.id,
            patient_id=patient_id,
            status=SessionStatus.PROCESSING
        )
        db.add(session)
        await db.flush()
        
        await websocket.send_text(make_event("session_started",data={"session_id":str(session.id),"patient_id":patient_id}))
        
        initial_state={
            "session_id":str(session.id),
            "patient_id":patient_id,
            "raw_complaint":complaint,
            "reported_vitals":message.get("vitals"),
        }
        
        final_state={}
        
        async for chunk in triage_graph.astream(initial_state,stream_mode="updates"):
            for node_name,node_state in chunk.items():
                final_state.update(node_state)
                await websocket.send_text(make_event("node_complete",node=node_name,data={
                    "last_node":node_state.get("last_node"),
                    "extracted_symptoms":node_state.get("extracted_symptoms"),
                    "pain_score":node_state.get("pain_score"),
                    "esi_level":node_state.get("esi_level"),
                    "disposition_zone":node_state.get("disposition_zone"),
                    "escalated":node_state.get("escalated")}))
        
        record = TriageRecord(
            session_id=session.id,
            raw_complaint=complaint,
            extracted_symptoms=final_state.get("extracted_symptoms", []),
            extracted_entities=final_state.get("extracted_entities", {}),
            pain_score=final_state.get("pain_score"),
            life_threat=final_state.get("life_threat", False),
            high_risk=final_state.get("high_risk", False),
            estimated_resources=final_state.get("estimated_resources", []),
            danger_zone_vitals=final_state.get("danger_zone_vitals", False),
            esi_level=final_state.get("esi_level"),
            esi_reasoning=final_state.get("esi_reasoning"),
            disposition_zone=final_state.get("disposition_zone"),
            escalated=final_state.get("escalated", False),
        )
        db.add(record)
        
        session.status=(
            SessionStatus.ESCALATED if final_state.get("escalated") else SessionStatus.COMPLETED
        )
        await db.flush()
        
        await websocket.send_text(make_event(
            "triage_complete",
            data={
                "session_id": str(session.id),
                "esi_level": final_state.get("esi_level"),
                "disposition_zone": final_state.get("disposition_zone"),
                "escalated": final_state.get("escalated"),
                "esi_reasoning": final_state.get("esi_reasoning"),
                "extracted_symptoms": final_state.get("extracted_symptoms"),
                "clinical_notes": final_state.get("extracted_entities", {}).get("groq_clinical_notes"),
            }
        ))
        
    except WebSocketDisconnect:
        pass
    
    except Exception as e:
        await websocket.send_text(make_event("error",data={"detail":str(e)}))
        
    finally:
        await websocket.close()