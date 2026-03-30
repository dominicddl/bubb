import time
import jwt
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.config import settings

TEST_JWT_SECRET = "test-jwt-secret-for-unit-tests"
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"
TEST_EMAIL = "testuser@example.com"


@pytest.fixture(autouse=True)
def override_jwt_secret(monkeypatch):
    """Override JWT secret for all tests."""
    monkeypatch.setattr(settings, "supabase_jwt_secret", TEST_JWT_SECRET)


@pytest.fixture
def valid_token() -> str:
    """Create a valid JWT token mimicking Supabase format."""
    payload = {
        "sub": TEST_USER_ID,
        "email": TEST_EMAIL,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture
def expired_token() -> str:
    """Create an expired JWT token."""
    payload = {
        "sub": TEST_USER_ID,
        "email": TEST_EMAIL,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": int(time.time()) - 3600,
        "iat": int(time.time()) - 7200,
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture
async def client():
    """Async test client for FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset rate limiter state between tests to prevent cross-test leakage."""
    from app.rate_limit import limiter
    limiter._storage.reset()
    yield
    limiter._storage.reset()


def pytest_configure(config):
    config.addinivalue_line("markers", "rls: requires local Supabase instance")
