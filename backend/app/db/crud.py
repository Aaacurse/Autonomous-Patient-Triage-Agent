from app.db.models import User,TriageRecord,TriageSession
from sqlalchemy import select,desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr
from app.core.security import hash_password
import uuid


async def get_user_by_email(db:AsyncSession,email:EmailStr):
    result=await db.execute(select(User).where(User.email==email))
    
    user=result.scalar_one_or_none()
    
    return user


async def create_user(db:AsyncSession,email:EmailStr,full_name:str,password:str):
    hashed_password=hash_password(password)
    user=User(email=email,full_name=full_name,hashed_password=hashed_password)
    db.add(user) 
    await db.commit()
    await db.refresh(user)
    
    return user

async def get_sessions_with_record(db:AsyncSession,session_id:str):
    result=await db.execute(select(TriageSession).where(TriageSession.id==session_id).options(selectinload(TriageSession.record)))
    
    session=result.scalar_one_or_none()
    
    return session

async def get_user_sessions(db:AsyncSession,nurse_id:str):
    result=await db.execute(select(TriageSession).where(TriageSession.nurse_id==nurse_id).order_by(TriageSession.created_at.desc()))
    
    sessions=result.scalars().all()
    
    return sessions    