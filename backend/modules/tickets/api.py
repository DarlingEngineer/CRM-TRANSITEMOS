from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from .schemas import TicketCreate, TicketUpdate, TicketResponse
from .repository import TicketRepository
from .service import TicketService

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/", response_model=TicketResponse)
def create_ticket(
    data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = TicketService(TicketRepository(db))
    return service.create_ticket(
        title=data.title,
        body=data.body,
        priority=data.priority,
        user_id=current_user["user_id"],
    )

@router.get("/", response_model=list[TicketResponse])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = TicketService(TicketRepository(db))
    return service.list_tickets(current_user["user_id"], current_user["role"])

@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = TicketService(TicketRepository(db))
    try:
        return service.update_status(ticket_id, data.status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))