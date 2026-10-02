from pydantic import BaseModel
from typing import Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TicketCreate(BaseModel):
    title: str
    body: str | None = None
    priority: Literal["Alta", "Media", "Baja"]
    area: str

class TicketUpdate(BaseModel):
    status: Literal["Abierto", "En proceso", "Resuelto", "Cerrado"]

class TicketResponse(BaseModel):
    id: int
    title: str
    body: str | None
    priority: str
    status: str
    area: str
    user_id: int
    created_at: datetime
    updated_at: datetime


    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_ticket(cls, ticket):
        """Aplana el objeto Ticket, sustituyendo area_id por el nombre real del área."""
        return cls(
            id=ticket.id,
            title=ticket.title,
            body=ticket.body,
            priority=ticket.priority,
            status=ticket.status,
            area=ticket.area.name,
            user_id=ticket.user_id,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
        )