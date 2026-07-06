import uuid
from datetime import datetime
from sqlalchemy import (Column,String,Boolean,Integer,DateTime,ForeignKey,JSON,Enum as SAEnum)
from sqlalchemy.orm import DeclarativeBase,relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

class Base(DeclarativeBase):
    pass

class ESILevel(enum.IntEnum):
    ONE=1
    TWO=2
    THREE=3
    FOUR=4
    FIVE=5
    
class SessionStatus(str,enum.Enum):
    PENDING="pending"
    PROCESSING="processing"
    COMPLETED="completed"
    ESCALATED="escalated"
    ERROR="error"
    
class User(Base):
    __tablename__="users"
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    email=Column(String,unique=True,nullable=False,index=True)
    full_name=Column(String,nullable=False)
    hashed_password=Column(String,nullable=False)
    is_active=Column(Boolean,default=True)
    is_superuser=Column(Boolean,default=True)
    created_at=Column(DateTime,default=datetime.now)
    sessions=relationship("TriageSession", back_populates="nurse")
    
class TriageSession(Base):
    __tablename__="triage_sessions"
    
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)
    nurse_id=Column(UUID(as_uuid=True),ForeignKey("users.id"),nullable=False)
    patient_id=Column(String,nullable=False)
    status=Column(SAEnum(SessionStatus),default=SessionStatus.PENDING)
    created_at=Column(DateTime,default=datetime.now)
    updated_at=Column(DateTime,default=datetime.now,onupdate=datetime.now)
    nurse=relationship("User",back_populates="sessions")
    record=relationship("TriageRecord",back_populates="session",uselist=False)
    
    
    
class TriageRecord(Base):
    __tablename__ = "triage_records"

    id=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id=Column(UUID(as_uuid=True), ForeignKey("triage_sessions.id"), nullable=False)
    raw_complaint=Column(String, nullable=False)
    extracted_symptoms= Column(JSON, default=list)
    extracted_entities=Column(JSON, default=dict)
    pain_score=Column(Integer, nullable=True)
    life_threat=Column(Boolean, default=False)
    high_risk=Column(Boolean, default=False)
    estimated_resources=Column(JSON, default=list)
    danger_zone_vitals=Column(Boolean, default=False)
    esi_level=Column(Integer, nullable=True)
    esi_reasoning=Column(String, nullable=True)
    disposition_zone=Column(String, nullable=True)
    escalated=Column(Boolean, default=False)
    created_at=Column(DateTime, default=datetime.now)

    session = relationship("TriageSession", back_populates="record")