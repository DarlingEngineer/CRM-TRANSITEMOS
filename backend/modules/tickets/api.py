from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.database import get_db
from core.permissions import require_roles
from .schemas import TicketCreate, TicketUpdate, TicketResponse
from .repository import TicketRepository
from .service import TicketService

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/", response_model=TicketResponse)
def create_ticket(
    data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "tecnico", "solicitante")),
):
    service = TicketService(TicketRepository(db))
    try:
        ticket = service.create_ticket(data.title, data.body, data.priority, data.area, current_user["user_id"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return TicketResponse.from_ticket(ticket)

@router.get("/", response_model=list[TicketResponse])
def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "tecnico")),
):
    service = TicketService(TicketRepository(db))
    tickets = service.list_tickets(current_user["user_id"], current_user["role"], skip, limit)
    return [TicketResponse.from_ticket(t) for t in tickets]

@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "tecnico")),
):
    service = TicketService(TicketRepository(db))
    try:
        ticket = service.update_status(ticket_id, data.status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return TicketResponse.from_ticket(ticket)