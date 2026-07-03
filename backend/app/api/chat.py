import logging

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_rag_pipeline
from app.models.schemas import ChatRequest, ChatResponse, SourceDoc
from app.rag.pipeline import RAGPipeline

router = APIRouter()

logger = logging.getLogger("uvicorn.error")


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    pipeline: RAGPipeline = Depends(get_rag_pipeline)
):
    try:
        result = pipeline.run(question=request.question)

        sources = [
            SourceDoc(
                term=doc["term"],
                aliases=doc.get("aliases", []),
                keywords=doc.get("keywords", []),
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
            sources=sources,
            confidence=result["confidence"],
            related_topics=result["related_topics"]
        )

    except Exception:
        logger.exception("Chat endpoint failed")

        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing the query."
        )