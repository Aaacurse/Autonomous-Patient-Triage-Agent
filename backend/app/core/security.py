from datetime import datetime,timedelta,UTC
from typing import Literal
from jose import jwt,JWTError #type:ignore
from passlib.context import CryptContext #type:ignore
from app.core.config import settings

pwd_context=CryptContext(schemes=['bcrypt'],deprecated="auto")

def hash_password(plain_password:str)->str:
    return pwd_context.hash(plain_password)

def verify_password(plain_password:str,hashed_password:str)->bool:
    return pwd_context.verify(plain_password,hashed_password)

def create_token(
    subject:str,token_type: Literal["access","refresh"]
)->str:
    if token_type=="access":
        expire=datetime.now(UTC)+timedelta(minutes=settings.access_token_expire_minutes)
    else:
        expire=datetime.now(UTC)+timedelta(days=settings.refresh_token_expire_days)
        
    payload={
        'sub':subject,
        "type":token_type,
        "exp":expire,
        "iat":datetime.now(UTC)
    }
    
    return jwt.encode(payload,settings.jwt_secret_key,algorithm=settings.jwt_algorithm)


def decode_token(token:str,expected_type:Literal["access","refresh"])->str:
    try:
        payload=jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=settings.jwt_algorithm
        )
        email:str=payload.get("sub")
        token_type:str=payload.get("type")
        
        if email is None:
            raise ValueError("Token missing subject")
        
        if token_type!=expected_type:
            raise ValueError(f"Expected {expected_type} token got {token_type}")
        
        return email
    except JWTError:
        raise ValueError("Invalid or expired token")