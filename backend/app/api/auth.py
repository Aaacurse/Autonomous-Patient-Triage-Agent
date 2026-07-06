from fastapi import APIRouter,Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel,EmailStr
from app.db.sessions import get_db
from app.db.models import User
from app.db.crud import get_user_by_email,create_user
from app.core.security import hash_password,decode_token,create_token,verify_password


router=APIRouter(prefix='/auth',tags=["auth"])

oauth2_scheme=OAuth2PasswordBearer(tokenUrl="auth/login")


class RegisterRequest(BaseModel):
    email:EmailStr
    full_name:str
    password:str
    
class LoginRequest(BaseModel):
    email:EmailStr
    password:str
    
class TokenResponse(BaseModel):
    access_token:str
    refresh_token:str
    token_type: str="bearer"
    
class RefreshRequest(BaseModel):
    refresh_token:str
    
    
@router.post('/register',response_model=TokenResponse,status_code=status.HTTP_201_CREATED)
async def register(payload:RegisterRequest,db:AsyncSession=Depends(get_db)):
    existing=await get_user_by_email(db=db,email=payload.email)
    
    if existing:
        raise HTTPException(status_code=400,detail="Email already Registered")
    
    user= await create_user(db,payload.email,payload.full_name,payload.password)
    access_token=create_token(payload.email,"access")
    refresh_token=create_token(payload.email,"refresh")
    
    return TokenResponse(access_token=access_token,refresh_token=refresh_token)


@router.post('/login',response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(),db:AsyncSession=Depends(get_db)):
    user=await get_user_by_email(db=db,email=form.username)
    
    if not user or not verify_password(form.password,user.hashed_password):
        raise HTTPException(status_code=401,detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403,detail="Account is inactive")
    
    access_token=create_token(user.email,"access")
    refresh_token=create_token(user.email,"refresh")
    
    return TokenResponse(access_token=access_token,refresh_token=refresh_token)


@router.post("/refresh",response_model=TokenResponse)
async def refresh(payload:RefreshRequest,db:AsyncSession=Depends(get_db)):
    try:
        email=decode_token(payload.refresh_token,"refresh")
    except ValueError:
        raise HTTPException(status_code=401,detail="Invalid refresh token")
    
    user=await get_user_by_email(db=db,email=email)
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401,detail="User not found or inactive")
    
     
    access_token=create_token(user.email,"access")
    refresh_token=create_token(user.email,"refresh")
    
    return TokenResponse(access_token=access_token,refresh_token=refresh_token)


async def get_current_user(token:str=Depends(oauth2_scheme),db:AsyncSession=Depends(get_db)):
    payload=decode_token(token)
    email=payload.get("sub")
    if not email:
        raise HTTPException(status_code=401,detail="Invalid credentials")
    
    user=await get_user_by_email(db=db,email=email)
    
    if not user:
        raise HTTPException(status_code=401,detail="User not found")
    
    return user
    