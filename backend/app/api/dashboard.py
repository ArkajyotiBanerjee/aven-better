from fastapi import APIRouter, Depends
from typing import Optional
from app.models.dashboard import DashboardOverviewResponse
from app.models.user import UserProfile
from app.services.dashboard_service import DashboardService
from app.api.auth import get_current_user_optional

router = APIRouter()

@router.get("", response_model=DashboardOverviewResponse)
def get_dashboard_overview(user: Optional[UserProfile] = Depends(get_current_user_optional)):
    """
    Returns aggregated learner dashboard overview including profile, multi-dimensional
    readiness metrics, active learning gaps, actionable missions, and achievement milestones.
    """
    service = DashboardService.get_instance()
    return service.get_dashboard_overview(user=user)
