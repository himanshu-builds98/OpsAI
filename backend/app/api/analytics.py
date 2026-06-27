from fastapi import APIRouter, Depends
from app.models.schemas import AnalyticsResponse, TermCount
from app.services.analytics_service import AnalyticsService
from app.dependencies import get_analytics_service

router = APIRouter()

@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(analytics_service: AnalyticsService = Depends(get_analytics_service)):
    """
    GET /api/analytics
    Returns aggregated metrics, search success rates, popular queries, and speed analytics.
    """
    stats = analytics_service.get_analytics()
    
    # Map raw stats to Pydantic schemas
    popular = [
        TermCount(term=item["term"], count=item["count"])
        for item in stats["popular_terms"]
    ]
    
    return AnalyticsResponse(
        total_questions=stats["total_questions"],
        mode_distribution=stats["mode_distribution"],
        popular_terms=popular,
        failed_searches_count=stats["failed_searches_count"],
        recent_failed_searches=stats["recent_failed_searches"],
        average_response_time=stats["average_response_time"]
    )
