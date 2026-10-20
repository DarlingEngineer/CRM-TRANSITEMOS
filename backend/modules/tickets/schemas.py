from pydantic import BaseModel, ConfigDict
from typing import Literal
from datetime import datetime


class TicketCreate(BaseModel):
    title: str
    body: str | None = None
    priority: Literal["Alta", "Media", "Baja", "Urgente"]
    area: str


class TicketUpdate(BaseModel):
    status: Literal["Abierto", "En proceso", "Resuelto", "Cerrado"]


class TicketResponse(BaseModel):
    id: int
    title: str
    body: str | None = None
    priority: str
    status: str
    area: str
    user_id: int
    updated_by: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_ticket(cls, ticket):
        return cls(
            id=ticket.id,
            title=ticket.title,
            body=ticket.body,
            priority=ticket.priority,
            status=ticket.status,
            area=ticket.area.name,
            user_id=ticket.user_id,
            updated_by=getattr(ticket, "updated_by", None),
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
        )


class TicketHistoryResponse(BaseModel):
    id: int
    old_status: str | None
    new_status: str
    changed_by_id: int
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)