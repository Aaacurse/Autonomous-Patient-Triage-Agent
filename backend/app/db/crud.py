from app.db.models import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr
from app.core.security import hash_password


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