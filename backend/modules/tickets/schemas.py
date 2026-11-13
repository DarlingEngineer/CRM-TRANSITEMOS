from pydantic import BaseModel, ConfigDict, model_validator
from typing import Literal
from datetime import datetime


class TicketCreate(BaseModel):
    title: str
    body: str | None = None
    priority: Literal["Alta", "Media", "Baja", "Urgente"]
    area: str


class TicketUpdate(BaseModel):
    status: Literal["Abierto", "En proceso", "Resuelto", "Cerrado"]
    solution: str | None = None

    @model_validator(mode="after")
    def solucion_obligatoria_al_resolver(self):
        if self.status == "Resuelto" and not (self.solution and self.solution.strip()):
            raise ValueError("Debes escribir la solución para marcar el ticket como Resuelto")
        return self


class TicketResponse(BaseModel):
    id: int
    title: str
    body: str | None = None
    priority: str
    status: str
    area: str
    user_id: int
    updated_by: str | None = None
    solution: str | None = None
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
                solution=ticket.solution,
                created_at=ticket.created_at,
                updated_at=ticket.updated_at,
            )

class TicketEdit(BaseModel):
    """Edición parcial: solo se cambia lo que venga en la petición."""
    priority: Literal["Alta", "Media", "Baja", "Urgente"] | None = None
    solution: str | None = None

    @model_validator(mode="after")
    def al_menos_un_campo(self):
        if self.priority is None and not (self.solution and self.solution.strip()):
            raise ValueError("Indica la prioridad o la solución que quieres guardar")
        return self

    


class TicketHistoryResponse(BaseModel):
    id: int
    old_status: str | None
    new_status: str
    solution: str | None = None
    changed_by_id: int
    changed_at: datetime
    

    model_config = ConfigDict(from_attributes=True)