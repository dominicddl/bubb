from pydantic import BaseModel


class ExplainRequest(BaseModel):
    text: str           # highlighted text
    context: str        # surrounding paragraph (~500 chars max)
    source_url: str     # window.location.href
    page_title: str     # document.title


class ExplainResponse(BaseModel):
    explanation: str
