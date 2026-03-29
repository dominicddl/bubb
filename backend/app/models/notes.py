from pydantic import BaseModel, Field
from datetime import datetime


class NoteResponse(BaseModel):
    id: str
    highlighted_text: str
    explanation: str
    source_url: str
    page_title: str | None
    topic_id: str | None
    created_at: datetime


class NoteCountResponse(BaseModel):
    count: int


class AssignTopicRequest(BaseModel):
    topic_id: str = Field(max_length=36)
