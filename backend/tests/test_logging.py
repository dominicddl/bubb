"""Tests for structured logging configuration."""

import json

import structlog


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
