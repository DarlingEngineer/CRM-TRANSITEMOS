"""Logica de negocio del modulo de tickets

Esta capa decide que se puede hacer con un ticket y que no, y delega la persistencia de datos a la capa de repositorio.
"""
from .repository import TicketRepository

class TicketService:
    """Orquesta las operaciones sobre tickets aplicando la logica de negocio y delegando la persistencia a la capa de repositorio."""
    def __init__(self, repository: TicketRepository):
        self.repository = repository

    def create_ticket(self, title: str, body: str | None, priority: str, area: str, user_id: int):
        return self.repository.create(title, body, priority, area, user_id)

    def list_tickets(self, user_id: int, role: str):
        # Los admins ven todos los tickets; el resto solo los propios
        # Devuelve los tickets visibles para el usuario según su rol
        if role == "admin":
            return self.repository.list_all()
        return self.repository.list_by_user(user_id)

    def update_status(self, ticket_id: int, new_status: str):
        """Actualiza el estado de un ticket. Solo los admins pueden cambiar el estado a 'resuelto' o 'cerrado'."""
        ticket = self.repository.get_by_id(ticket_id)
        if not ticket:
            raise ValueError("Ticket no encontrado")
        return self.repository.update_status(ticket, new_status)