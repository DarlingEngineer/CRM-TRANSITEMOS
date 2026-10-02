from sqlalchemy.orm import Session
from .models import Ticket, Area

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

    def update_status(self, ticket: Ticket, new_status: str) -> Ticket:
        ticket.status = new_status
        self.db.commit()
        self.db.refresh(ticket)
        return ticket