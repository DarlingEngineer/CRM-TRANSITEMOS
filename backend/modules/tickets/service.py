from .repository import TicketRepository

class TicketService:
    def __init__(self, repository: TicketRepository):
        self.repository = repository

    def create_ticket(self, title: str, body: str | None, priority: str, user_id: int):
        return self.repository.create(title, body, priority, user_id)

    def list_tickets(self, user_id: int, role: str):
        # Los admins ven todos los tickets; el resto solo los propios
        if role == "admin":
            return self.repository.list_all()
        return self.repository.list_by_user(user_id)

    def update_status(self, ticket_id: int, new_status: str):
        ticket = self.repository.get_by_id(ticket_id)
        if not ticket:
            raise ValueError("Ticket no encontrado")
        return self.repository.update_status(ticket, new_status)