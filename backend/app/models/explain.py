from typing import Literal

from pydantic import BaseModel, Field

Provider = Literal["anthropic", "openai"]


class ExplainRequest(BaseModel):
    text: str = Field(max_length=5000)
    context: str = Field(max_length=2000)
    source_url: str = Field(max_length=2000)
    page_title: str = Field(max_length=500)
    provider: Provider | None = None


class ExplainResponse(BaseModel):
    explanation: str
    provider: str


DepthLevel = Literal["simple", "standard", "deep"]


class ConversationTurn(BaseModel):
    question: str = Field(max_length=1000)
    answer: str = Field(max_length=5000)


class StreamExplainRequest(BaseModel):
    text: str = Field(max_length=5000)
    context: str = Field(max_length=2000)
    source_url: str = Field(max_length=2000)
    page_title: str = Field(max_length=500)
    depth: DepthLevel = "simple"
    provider: Provider | None = None
    conversation_history: list[ConversationTurn] = Field(default=[], max_length=20)
    follow_up_question: str | None = Field(default=None, max_length=1000)
