import pytest
import pytest_asyncio

@pytest_asyncio.fixture
async def registered_user(client):
    response=await client.post(
        "/auth/register",
        json={
            "email": "john@example.com",
            "full_name": "John Doe",
            "password": "password123",
        },
    )
    return {
        "email": "john@example.com",
        "password": "password123",
    }

@pytest.mark.asyncio
async def test_register(client):
    
    response= await client.post(
        '/auth/register',
        json={
            'email':'john@example.com',
            'full_name':'John Doe',
            'password':'password123'
        }
    )
    
    assert response.status_code==201
   
@pytest.mark.asyncio 
async def test_login(client,registered_user):
    response = await client.post(
        '/auth/login',
        data={
            'username': registered_user['email'],
            'password': registered_user['password']
        }
    )
    assert response.status_code==200
    
    body=response.json()
    assert "access_token" in body
    assert "refresh_token" in body


    
@pytest.mark.asyncio
async def test_duplicate_register(client,registered_user):
    
    response= await client.post(
        '/auth/register',
        json={
            'email':registered_user['email'],
            'full_name':'Jojo',
            'password': registered_user['password']
        }
    )
    
    assert response.status_code==400,response.json()


@pytest.mark.asyncio
async def test_invalid_password(client,registered_user):
    response= await client.post(
        '/auth/login',
        data={
            'username':registered_user['email'],
            'password': 'incorrect_password'
        }
    )
    assert response.status_code==401
    
