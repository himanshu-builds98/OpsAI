from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import ChatRequest, ChatResponse, SourceDoc
from app.rag.pipeline import RAGPipeline
from app.dependencies import get_rag_pipeline

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, pipeline: RAGPipeline = Depends(get_rag_pipeline)):
    """
    POST /api/chat
    Processes trade-related user queries using semantic search and local/cloud LLMs.
    """
    mode = request.mode.lower().strip()
    if mode not in ["quick", "detailed", "comparison"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid mode parameter. Supported values: 'quick', 'detailed', 'comparison'."
        )
        
    try:
        result = pipeline.run(
            question=request.question,
            requested_mode=mode,
            user_level=request.user_level
        )
        
        # Map source dictionaries to Pydantic models
        sources = [
            SourceDoc(
                term=doc["term"],
                definition=doc["definition"],
                created_by=doc["created_by"],
                used_by=doc["used_by"],
                purpose=doc["purpose"],
                common_problems=doc["common_problems"],
                score=doc["score"]
            )
            for doc in result["sources"]
        ]
        
        return ChatResponse(
            answer=result["answer"],
            mode=result["mode"],
            sources=sources,
            confidence=result["confidence"],
            related_topics=result["related_topics"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error executing query in RAG pipeline: {str(e)}"
        )
