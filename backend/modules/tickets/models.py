from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from core.database import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    body = Column(Text)
    priority = Column(String, nullable=False)
    status = Column(String, nullable=False, default="Abierto")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())