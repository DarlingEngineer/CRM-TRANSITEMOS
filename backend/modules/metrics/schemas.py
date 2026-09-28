from pydantic import BaseModel

class TicketsPerMonth(BaseModel):
    year: int
    month: int
    total: int

class TicketsPerArea(BaseModel):
    area: str
    total: int

class ResponseTimeMetric(BaseModel):
    average_hours: float | None
    resolved_tickets_count: int