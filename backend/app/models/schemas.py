from pydantic import BaseModel, Field
from typing import List, Dict, Optional

# ============================================================
# Chat Schemas
# ============================================================
class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        description="The user's natural language query."
    )


class SourceDoc(BaseModel):
    term: str = Field(
        ...,
        description="Matched trade term."
    )

    aliases: List[str] = Field(
        default_factory=list,
        description="Known aliases or abbreviations."
    )

    keywords: List[str] = Field(
        default_factory=list,
        description="Indexed keywords."
    )

    definition: str = Field(
        ...,
        description="Definition."
    )

    created_by: str = Field(
        ...,
        description="Created By."
    )

    used_by: str = Field(
        ...,
        description="Used By."
    )

    purpose: str = Field(
        ...,
        description="Purpose."
    )

    common_problems: str = Field(
        ...,
        description="Common Problems."
    )

    score: float = Field(
        ...,
        description="Final retrieval score."
    )


class ChatResponse(BaseModel):
    answer: str = Field(
        ...,
        description="Generated answer."
    )

    sources: List[SourceDoc] = Field(
        default_factory=list,
        description="Retrieved source documents."
    )

    confidence: str = Field(
        ...,
        description="High / Medium / Low / None"
    )

    related_topics: List[str] = Field(
        default_factory=list,
        description="Suggested follow-up topics."
    )

# ============================================================
# Upload Schemas
# ============================================================
class UploadResponse(BaseModel):
    filename: str
    status: str
    records_indexed: int
    message: str

# ============================================================
# Analytics Schemas
# ============================================================
class TermCount(BaseModel):
    term: str
    count: int

class AnalyticsResponse(BaseModel):
    total_questions: int
    mode_distribution: Dict[str, int]
    popular_terms: List[TermCount]
    failed_searches_count: int
    recent_failed_searches: List[str]
    average_response_time: float

# ============================================================
# Knowledge Status
# ============================================================
class SourceFileInfo(BaseModel):
    filename: str
    file_type: str
    records_count: int
    last_modified: str

class KnowledgeStatusResponse(BaseModel):
    is_initialized: bool
    total_terms: int
    total_vectors: int
    last_sync_time: Optional[str] = None
    source_files: List[SourceFileInfo]