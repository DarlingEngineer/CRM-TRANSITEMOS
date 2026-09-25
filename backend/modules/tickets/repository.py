from sqlalchemy.orm import Session
from .models import Ticket

class TicketRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, title: str, body: str | None, priority: str, user_id: int) -> Ticket:
        ticket = Ticket(title=title, body=body, priority=priority, user_id=user_id)
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def list_all(self) -> list[Ticket]:
        return self.db.query(Ticket).all()

    def list_by_user(self, user_id: int) -> list[Ticket]:
        return self.db.query(Ticket).filter(Ticket.user_id == user_id).all()

    def get_by_id(self, ticket_id: int) -> Ticket | None:
        return self.db.query(Ticket).filter(Ticket.id == ticket_id).first()

    def update_status(self, ticket: Ticket, new_status: str) -> Ticket:
        ticket.status = new_status
        self.db.commit()
        self.db.refresh(ticket)
        return ticket