import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from app.auth.dependencies import get_current_user


@pytest.mark.asyncio
async def test_get_current_user_no_cred():
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(cred=None)
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Bearer authentication required"


@pytest.mark.asyncio
async def test_get_current_user_valid(valid_token):
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials=valid_token)
    result = await get_current_user(cred=cred)
    assert "sub" in result
    assert result["email"] == "testuser@example.com"


@pytest.mark.asyncio
async def test_get_current_user_expired(expired_token):
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials=expired_token)
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(cred=cred)
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Token expired"


@pytest.mark.asyncio
async def test_get_current_user_invalid():
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials="not-a-real-jwt")
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(cred=cred)
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid authentication credentials"
