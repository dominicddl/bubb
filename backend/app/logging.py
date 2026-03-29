"""Structured logging configuration using structlog."""

import logging
import sys

import structlog


SENSITIVE_KEYS = {"token", "key", "secret", "password"}


def _filter_sensitive_data(
    logger: logging.Logger, method_name: str, event_dict: dict
) -> dict:
    """Redact values for keys that contain sensitive words as word components.

    A key is considered sensitive if any sensitive word appears as a
    whole component when the key is split by underscores (e.g. ``api_key``
    is sensitive because ``key`` is a component, but ``key`` alone as a
    standalone field is not redacted because the structlog internal ``event``
    and generic single-word keys are expected to be safe).

    Standalone single-component keys (no underscores) are only redacted when
    the entire key exactly matches a sensitive word AND it is longer than 3
    characters, preventing overly broad matches on short generic names.
    """
    for k in list(event_dict.keys()):
        parts = k.lower().split("_")
        if len(parts) > 1:
            # Compound key: redact if any component matches a sensitive word
            if any(word in parts for word in SENSITIVE_KEYS):
                event_dict[k] = "[REDACTED]"
        else:
            # Single-component key: only redact if it exactly matches and is
            # a meaningful sensitive word (length > 3 to avoid short generic names)
            if k.lower() in SENSITIVE_KEYS and len(k) > 3:
                event_dict[k] = "[REDACTED]"
    return event_dict


def setup_logging() -> None:
    """Configure structlog with JSON output to stdout."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            _filter_sensitive_data,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=False,
    )
