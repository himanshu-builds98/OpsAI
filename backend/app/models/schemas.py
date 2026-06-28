from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Chat Schemas
class ChatRequest(BaseModel):
    question: str = Field(..., description="The user query or trade terminology.")
    mode: str = Field("quick", description="The response mode ('quick', 'detailed', or 'comparison'). Default is 'quick'.")
    user_level: str = Field("student", description="Target persona level ('student' or 'professional'). Default is 'student'.")

class SourceDoc(BaseModel):
    term: str = Field(..., description="Matched trade term.")
    definition: str = Field(..., description="Definition details.")
    created_by: str = Field(..., description="Entity creating/sending the document.")
    used_by: str = Field(..., description="Entity receiving/using the document.")
    purpose: str = Field(..., description="Operational purpose.")
    common_problems: str = Field(..., description="Common mistakes or issues.")
    score: float = Field(..., description="Similarity score.")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="Structured AI response.")
    mode: str = Field(..., description="Active response mode used.")
    sources: List[SourceDoc] = Field(..., description="List of source document citations from the vector database.")
    confidence: str = Field(..., description="Database match confidence level ('High', 'Medium', 'Low', 'None').")
    related_topics: List[str] = Field(..., description="List of 2-3 related concepts/terms for follow-up.")

# Document Upload Schemas
class UploadResponse(BaseModel):
    filename: str = Field(..., description="Name of the uploaded file.")
    status: str = Field(..., description="Ingestion status ('success' or 'failed').")
    records_indexed: int = Field(..., description="Number of document chunks or terms indexed into ChromaDB.")
    message: str = Field(..., description="Detailed status message.")

# Analytics Schemas
class TermCount(BaseModel):
    term: str
    count: int

class AnalyticsResponse(BaseModel):
    total_questions: int = Field(..., description="Total questions handled.")
    mode_distribution: Dict[str, int] = Field(..., description="Mode selection distribution statistics.")
    popular_terms: List[TermCount] = Field(..., description="Most frequently queried trade terms.")
    failed_searches_count: int = Field(..., description="Total searches returning empty or fallback responses.")
    recent_failed_searches: List[str] = Field(..., description="List of recently failed query strings.")
    average_response_time: float = Field(..., description="Average pipeline processing time in seconds.")

# Knowledge Status Schemas
class SourceFileInfo(BaseModel):
    filename: str = Field(..., description="Name of the source file.")
    file_type: str = Field(..., description="Type of the file (e.g. csv, pdf).")
    records_count: int = Field(..., description="Number of parsed chunks/records.")
    last_modified: str = Field(..., description="ISO timestamp of last modification.")

class KnowledgeStatusResponse(BaseModel):
    is_initialized: bool = Field(..., description="Whether vector DB has initialized records.")
    total_terms: int = Field(..., description="Total count of unique trade terms indexed.")
    total_vectors: int = Field(..., description="Total count of vectors indexed in ChromaDB.")
    last_sync_time: Optional[str] = Field(None, description="ISO timestamp of the latest sync.")
    source_files: List[SourceFileInfo] = Field(..., description="List of source files registered in database.")

