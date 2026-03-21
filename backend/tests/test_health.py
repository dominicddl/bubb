import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_health_auth_no_token(client):
    response = await client.get("/api/health/auth")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health_auth_valid_token(client, valid_token):
    response = await client.get(
        "/api/health/auth",
        headers={"Authorization": f"Bearer {valid_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "user_id" in data
    assert "email" in data


@pytest.mark.asyncio
async def test_health_auth_expired_token(client, expired_token):
    response = await client.get(
        "/api/health/auth",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert "Token expired" in response.json()["detail"]


@pytest.mark.asyncio
async def test_health_auth_invalid_token(client):
    response = await client.get(
        "/api/health/auth",
        headers={"Authorization": "Bearer garbage-token"},
    )
    assert response.status_code == 401
