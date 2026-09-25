from pydantic import BaseModel
from typing import Literal
from datetime import datetime

class TicketCreate(BaseModel):
    title: str
    body: str | None = None
    priority: Literal["Alta", "Media", "Baja"]

class TicketUpdate(BaseModel):
    status: Literal["Abierto", "En Proceso", "Resuelto", "Cerrado"]


class TicketResponse(BaseModel):
    id: int
    title: str
    body: str | None
    priority: str
    status: str
    user_id: int
    created_at: datetime
    updated_at: datetime

class Config:
    from_attributes = True