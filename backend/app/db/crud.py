from app.db.models import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import EmailStr


async def get_user_by_email(db:AsyncSession,email:EmailStr):
    result=await db.execute(select(User).where(User.email==email))
    
    user=result.scalar_one_or_none()
    
    return user