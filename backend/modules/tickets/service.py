from .repository import TicketRepository

class TicketService:
    def __init__(self, repository: TicketRepository):
        self.repository = repository

    def create_ticket(self, title: str, body: str | None, priority: str, area_name: str, user_id: int):
        area = self.repository.get_area_by_name(area_name)
        if not area:
            raise ValueError(f"El área '{area_name}' no existe")
        return self.repository.create(title, body, priority, area.id, user_id)

    def list_tickets(self, user_id: int, role: str, skip: int, limit: int):
        if role == "admin":
            return self.repository.list_all(skip, limit)
        return self.repository.list_by_user(user_id, skip, limit)

    def update_status(self, ticket_id: int, new_status: str):
        ticket = self.repository.get_by_id(ticket_id)
        if not ticket:
            raise ValueError("Ticket no encontrado")
        return self.repository.update_status(ticket, new_status)