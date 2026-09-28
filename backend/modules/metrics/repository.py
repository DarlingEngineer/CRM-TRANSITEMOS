from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from modules.tickets.models import Ticket

class MetricsRepository:
    def __init__(self, db: Session):
        self.db = db

    def tickets_per_month(self):
        return (
            self.db.query(
                extract("year", Ticket.created_at).label("year"),
                extract("month", Ticket.created_at).label("month"),
                func.count(Ticket.id).label("total"),
            )
            .group_by("year", "month")
            .order_by("year", "month")
            .all()
        )

    def tickets_per_area(self):
        return (
            self.db.query(Ticket.area, func.count(Ticket.id).label("total"))
            .group_by(Ticket.area)
            .order_by(func.count(Ticket.id).desc())
            .all()
        )

    def average_response_time_hours(self):
        resolved = (
            self.db.query(Ticket)
            .filter(Ticket.status.in_(["Resuelto", "Cerrado"]))
            .all()
        )
        if not resolved:
            return None, 0

        total_hours = sum(
            (t.updated_at - t.created_at).total_seconds() / 3600
            for t in resolved
        )
        return total_hours / len(resolved), len(resolved)