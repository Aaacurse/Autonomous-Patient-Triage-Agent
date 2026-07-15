import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine,async_sessionmaker
import pytest_asyncio

from main import app
from app.db.models import Base
from app.db.sessions import get_db

DATABASE_URL ="sqlite+aiosqlite:///./test.db"

transport = ASGITransport(app=app)

engine=create_async_engine(DATABASE_URL)

TestingSessionLocal= async_sessionmaker(
    engine,
    expire_on_commit=False
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session
        
app.dependency_overrides[get_db]=override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as ac:
        yield ac