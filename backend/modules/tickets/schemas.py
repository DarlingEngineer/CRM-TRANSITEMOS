from pydantic import BaseModel
from typing import Literal
from datetime import datetime

AREA = Literal["Registro Automotor","Concesionario","Cobro Coactivo", "Juridica", "Archivo", "Comercial", "Recursos Humanos"]

class TicketCreate(BaseModel):
    title: str
    body: str | None = None
    priority: Literal["Alta", "Media", "Baja"]
    area: AREA
class TicketUpdate(BaseModel):
    status: Literal["Abierto", "En Proceso", "Resuelto", "Cerrado"]


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

class Config:
    from_attributes = True