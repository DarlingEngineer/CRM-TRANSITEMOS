from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.permissions import require_roles
from .schemas import TicketsPerMonth, TicketsPerArea, ResponseTimeMetric
from .repository import MetricsRepository
from .service import MetricsService

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/tickets-per-month", response_model=list[TicketsPerMonth])
def tickets_per_month(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = MetricsService(MetricsRepository(db))
    return service.get_tickets_per_month()

@router.get("/tickets-per-area", response_model=list[TicketsPerArea])
def tickets_per_area(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = MetricsService(MetricsRepository(db))
    return service.get_tickets_per_area()

@router.get("/response-time", response_model=ResponseTimeMetric)
def response_time(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin")),
):
    service = MetricsService(MetricsRepository(db))
    return service.get_average_response_time()