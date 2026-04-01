import pytest
from unittest.mock import MagicMock, patch


@pytest.mark.asyncio
async def test_health_check(client):
    mock_supabase = MagicMock()
    mock_result = MagicMock()
    mock_result.data = [{"id": "test"}]
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result

    with patch("app.routers.health.get_supabase_admin", return_value=mock_supabase):
        response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


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


@pytest.mark.asyncio
async def test_health_check_returns_database_connected(client):
    """GET /api/health returns database: connected when DB is reachable."""
    mock_supabase = MagicMock()
    mock_result = MagicMock()
    mock_result.data = [{"status": 1}]
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result

    with patch("app.routers.health.get_supabase_admin", return_value=mock_supabase):
        response = await client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_health_check_returns_503_when_db_unreachable(client):
    """GET /api/health returns 503 with database: unreachable when DB is down."""
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.side_effect = Exception("connection refused")

    with patch("app.routers.health.get_supabase_admin", return_value=mock_supabase):
        response = await client.get("/api/health")

    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert data["database"] == "unreachable"
