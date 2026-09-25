from .repository import UserRepository
from .security import verify_password, create_access_token

class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def authenticate(self, username: str, password: str) -> str:
        user = self.repository.get_by_username(username)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Credenciales inválidas")
        return create_access_token(data={"sub": user.username, "user_id": user.id, "role": user.role.name})