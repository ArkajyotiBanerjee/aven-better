from fastapi import APIRouter
from app.models.dashboard import DashboardOverviewResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()

@router.get("", response_model=DashboardOverviewResponse)
def get_dashboard_overview():
    """
    Returns aggregated learner dashboard overview including profile, multi-dimensional
    readiness metrics, active learning gaps, actionable missions, and achievement milestones.
    """
    service = DashboardService.get_instance()
    return service.get_dashboard_overview()
