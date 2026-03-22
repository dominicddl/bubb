from typing import Literal

from pydantic import BaseModel

Provider = Literal["anthropic", "openai", "google"]


class ExplainRequest(BaseModel):
    text: str           # highlighted text
    context: str        # surrounding paragraph (~500 chars max)
    source_url: str     # window.location.href
    page_title: str     # document.title
    provider: Provider | None = None  # None = use server default


class ExplainResponse(BaseModel):
    explanation: str
    provider: str       # which provider actually handled the request
