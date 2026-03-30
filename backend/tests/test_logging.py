"""Tests for structured logging configuration."""

import json
from unittest.mock import MagicMock, patch

import pytest
import structlog

from tests.conftest import TEST_USER_ID


def test_structlog_outputs_json(capsys):
    """Logger outputs valid JSON to stdout."""
    from app.logging import setup_logging

    setup_logging()
    logger = structlog.get_logger()
    logger.info("test_event", key="value")

    captured = capsys.readouterr()
    line = captured.out.strip()
    parsed = json.loads(line)
    assert parsed["event"] == "test_event"
    assert parsed["key"] == "value"
    assert "timestamp" in parsed
    assert parsed["level"] == "info"


def test_sensitive_data_is_filtered(capsys):
    """Keys containing sensitive words have their values redacted."""
    from app.logging import setup_logging

    setup_logging()
    logger = structlog.get_logger()
    logger.info(
        "test_sensitive",
        api_key="sk-secret-123",
        auth_token="eyJhbGciOi...",
        supabase_jwt_secret="super-secret",
        user_password="hunter2",
        safe_field="this-is-fine",
    )

    captured = capsys.readouterr()
    line = captured.out.strip()
    parsed = json.loads(line)
    assert parsed["api_key"] == "[REDACTED]"
    assert parsed["auth_token"] == "[REDACTED]"
    assert parsed["supabase_jwt_secret"] == "[REDACTED]"
    assert parsed["user_password"] == "[REDACTED]"
    assert parsed["safe_field"] == "this-is-fine"


def test_debug_messages_are_filtered(capsys):
    """DEBUG level messages are not output."""
    from app.logging import setup_logging

    setup_logging()
    logger = structlog.get_logger()
    logger.debug("should_not_appear")
    logger.info("should_appear")

    captured = capsys.readouterr()
    assert "should_not_appear" not in captured.out
    assert "should_appear" in captured.out


@pytest.fixture
def mock_supabase_health():
    """Mock Supabase client for health endpoint DB check."""
    mock_supabase = MagicMock()
    mock_result = MagicMock()
    mock_result.data = [{"id": "test"}]
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.return_value = mock_result
    with patch("app.routers.health.get_supabase_admin", return_value=mock_supabase):
        yield mock_supabase


@pytest.mark.asyncio
async def test_request_middleware_logs_completion(client, mock_supabase_health, capsys):
    """Middleware logs request_completed with method, path, status, duration_ms."""
    from app.logging import setup_logging
    setup_logging()

    await client.get("/api/health")

    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().split("\n") if line]
    completed_lines = [json.loads(l) for l in lines if "request_completed" in l]
    assert len(completed_lines) >= 1
    log = completed_lines[0]
    assert log["method"] == "GET"
    assert log["path"] == "/api/health"
    assert log["status"] == 200
    assert "duration_ms" in log
    assert "request_id" in log


@pytest.mark.asyncio
async def test_request_middleware_includes_user_id_when_authenticated(
    client, valid_token, mock_supabase_health, capsys
):
    """Middleware binds user_id from JWT when authenticated."""
    from app.logging import setup_logging
    setup_logging()

    await client.get(
        "/api/health",
        headers={"Authorization": f"Bearer {valid_token}"},
    )

    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().split("\n") if line]
    completed_lines = [json.loads(l) for l in lines if "request_completed" in l]
    assert len(completed_lines) >= 1
    log = completed_lines[0]
    assert log["user_id"] == TEST_USER_ID


@pytest.mark.asyncio
async def test_request_middleware_anonymous_when_no_token(client, mock_supabase_health, capsys):
    """Middleware sets user_id to anonymous when no JWT present."""
    from app.logging import setup_logging
    setup_logging()

    await client.get("/api/health")

    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().split("\n") if line]
    completed_lines = [json.loads(l) for l in lines if "request_completed" in l]
    assert len(completed_lines) >= 1
    log = completed_lines[0]
    assert log["user_id"] == "anonymous"
