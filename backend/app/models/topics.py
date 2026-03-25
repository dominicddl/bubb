from pydantic import BaseModel
from datetime import datetime

from app.models.explain import Provider


class TopicResponse(BaseModel):
    id: str
    name: str
    note_count: int
    created_at: datetime
    updated_at: datetime


class CreateTopicRequest(BaseModel):
    name: str


class TopicSuggestionRequest(BaseModel):
    highlighted_text: str
    explanation: str
    existing_topics: list[str] = []
    provider: Provider | None = None


class TopicSuggestionResponse(BaseModel):
    suggested_topic: str
    is_existing: bool
    existing_topic_id: str | None = None
