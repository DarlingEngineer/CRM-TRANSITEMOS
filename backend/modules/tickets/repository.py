from sqlalchemy.orm import Session
from .models import Ticket, Area, TicketHistory

class TicketRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_area_by_name(self, name: str) -> Area | None:
        return self.db.query(Area).filter(Area.name == name).first()

    def create(self, title: str, body: str | None, priority: str, area_id: int, user_id: int) -> Ticket:
        ticket = Ticket(title=title, body=body, priority=priority, area_id=area_id, user_id=user_id)
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def list_all(self, skip: int = 0, limit: int = 20) -> list[Ticket]:
        return self.db.query(Ticket).offset(skip).limit(limit).all()

    def list_by_user(self, user_id: int, skip: int = 0, limit: int = 20) -> list[Ticket]:
        return self.db.query(Ticket).filter(Ticket.user_id == user_id).offset(skip).limit(limit).all()

    def get_by_id(self, ticket_id: int) -> Ticket | None:
        return self.db.query(Ticket).filter(Ticket.id == ticket_id).first()

    def update_status(self, ticket: Ticket, new_status: str, username: str | None = None) -> Ticket:
        ticket.status = new_status
        if username is not None:
            ticket.updated_by = username
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def log_status_change(self, ticket_id: int, old_status: str | None, new_status: str, changed_by_id: int):
        entry = TicketHistory(
            ticket_id=ticket_id,
            old_status=old_status,
            new_status=new_status,
            changed_by_id=changed_by_id,
    )
        self.db.add(entry)
        self.db.commit()

    def get_history(self, ticket_id: int):
        return (
            self.db.query(TicketHistory)
            .filter(TicketHistory.ticket_id == ticket_id)
            .order_by(TicketHistory.changed_at.asc())
            .all()
    )
    