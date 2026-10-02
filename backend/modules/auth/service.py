from .repository import UserRepository
from .security import verify_password, create_access_token, create_refresh_token, hash_password
from datetime import datetime, timezone

MAX_INTENTOS = 5
BLOQUEO_MINUTOS = 15
class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def authenticate(self, username: str, password: str) -> dict:
        user = self.repository.get_by_username(username)
        if not user:
            raise ValueError("Credenciales inválidas")

        if user.locked_until and user.locked_until > datetime.now(timezone.utc).replace(tzinfo=None):
            raise PermissionError("Cuenta bloqueada temporalmente por demasiados intentos fallidos")

        if not verify_password(password, user.hashed_password):
            self.repository.register_failed_attempt(user, MAX_INTENTOS, BLOQUEO_MINUTOS)
            raise ValueError("Credenciales inválidas")

        if not user.is_active:
            raise PermissionError("Usuario deshabilitado")

        self.repository.reset_failed_attempts(user)

        payload = {"sub": user.username, "user_id": user.id, "role": user.role.name}
        return {
            "access_token": create_access_token(payload),
            "refresh_token": create_refresh_token(payload),
        }


class UserManagementService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def create_user(self, username: str, password: str, role_name: str):
        if self.repository.get_by_username(username):
            raise ValueError("Ese nombre de usuario ya existe")
        role = self.repository.get_role_by_name(role_name)
        if not role:
            raise ValueError(f"El rol '{role_name}' no existe")
        return self.repository.create(username, hash_password(password), role.id)

    def list_users(self, skip: int, limit: int):
        return self.repository.list_all(skip, limit)

    def deactivate_user(self, user_id: int):
        user = self.repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")
        return self.repository.set_active(user, False)

    def reactivate_user(self, user_id: int):
        user = self.repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")
        return self.repository.set_active(user, True)

    def change_role(self, user_id: int, role_name: str):
        user = self.repository.get_by_id(user_id)
        if not user:
            raise ValueError("Usuario no encontrado")
        role = self.repository.get_role_by_name(role_name)
        if not role:
            raise ValueError(f"El rol '{role_name}' no existe")
        return self.repository.set_role(user, role.id)