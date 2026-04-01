from pydantic import BaseModel, Field
from datetime import datetime

from app.models.explain import Provider


class TopicResponse(BaseModel):
    id: str
    name: str
    note_count: int
    created_at: datetime
    updated_at: datetime


class CreateTopicRequest(BaseModel):
    name: str = Field(max_length=100)


class TopicSuggestionRequest(BaseModel):
    highlighted_text: str = Field(max_length=5000)
    explanation: str = Field(max_length=5000)
    existing_topics: list[str] = Field(default=[], max_length=30)
    provider: Provider | None = None


class TopicSuggestionResponse(BaseModel):
    suggested_topic: str
    is_existing: bool
    existing_topic_id: str | None = None
