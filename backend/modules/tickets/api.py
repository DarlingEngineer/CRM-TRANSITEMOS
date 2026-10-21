from .schemas import TicketHistoryResponse, TicketCreate, TicketUpdate, TicketResponse
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.database import get_db
from core.permissions import require_roles
from .repository import TicketRepository
from .service import TicketService
from .models import Area
from pydantic import BaseModel

router = APIRouter(prefix="/tickets", tags=["tickets"])

areas_router = APIRouter(prefix="/areas", tags=["areas"])


class AreaCreate(BaseModel):
    name: str


@areas_router.get("/")
def list_areas(db: Session = Depends(get_db), current_user: dict = Depends(require_roles("admin", "tecnico", "solicitante"))):
    return [{"id": a.id, "name": a.name} for a in db.query(Area).order_by(Area.name).all()]


@areas_router.post("/", status_code=201)
def create_area(data: AreaCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_roles("admin"))):
    if db.query(Area).filter(Area.name == data.name).first():
        raise HTTPException(status_code=400, detail="El área ya existe")
    area = Area(name=data.name)
    db.add(area)
    db.commit()
    db.refresh(area)
    return {"id": area.id, "name": area.name}


@areas_router.delete("/{area_id}")
def delete_area(area_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_roles("admin"))):
    area = db.query(Area).get(area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada")
    db.delete(area)
    db.commit()
    return {"detail": "Área eliminada"}

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
    current_user: dict = Depends(require_roles("admin", "tecnico", "solicitante")),
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
        ticket = service.update_status(
            ticket_id,
            data.status,
            changed_by_id=current_user["user_id"],
            username=current_user.get("username"),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return TicketResponse.from_ticket(ticket)

@router.get("/{ticket_id}/history", response_model=list[TicketHistoryResponse])
def historial_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("admin", "tecnico")),
):
    service = TicketService(TicketRepository(db))
    return service.get_history(ticket_id)