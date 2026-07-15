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

    
@pytest_asyncio.fixture
async def logged_in_user(client,registered_user):
    response=await client.post(
        "/auth/login",
        data={
            "username": "john@example.com",
            "password": "password123",
        },
    )
    body=response.json()
    return {
        "access_token": body['access_token'],
        "refresh_token": body['refresh_token'],
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
    
@pytest.mark.asyncio
async def test_get_sessions_requires_auth(client):
    response=await client.get("/triage/sessions")
    
    assert response.status_code==401
    

@pytest.mark.asyncio
async def test_get_sessions_with_auth(client,logged_in_user):
    token={
        'access_token':logged_in_user['access_token'],
        'refresh_token':logged_in_user['refresh_token']
    }
    headers={
        'Authorization': f"Bearer {token['access_token']}"
    }
    
    response=await client.get(
        "/triage/sessions",
        headers=headers
    )
    
    assert response.status_code==200