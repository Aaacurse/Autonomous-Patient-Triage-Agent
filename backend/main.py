from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.websocket import router as ws_router
from app.api.triage import router as triage_router

from fastapi import Depends
from app.db.models import User
from app.api.auth import get_current_user

app = FastAPI(
    title="Autonomous Patient Triage Agent",
    description="AI-powered emergency department triage system",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"health": "ok"}


app.include_router(auth_router)
app.include_router(ws_router)
app.include_router(triage_router)


@app.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
    }
