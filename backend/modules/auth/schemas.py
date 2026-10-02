from pydantic import BaseModel
from typing import Literal
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    username: str
    password: str
    role: Literal["admin", "tecnico", "solicitante"]

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_user(cls, user):
        """Aplana el objeto User, sustituyendo el objeto Role por su nombre."""
        return cls(
            id=user.id,
            username=user.username,
            role=user.role.name,
            is_active=user.is_active,
            created_at=user.created_at,
        )

class RoleUpdate(BaseModel):
    role: Literal["admin", "tecnico", "solicitante"]