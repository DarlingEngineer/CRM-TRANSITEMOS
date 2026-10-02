from sqlalchemy.orm import Session
from .models import User, Role
from datetime import datetime, timedelta, timezone

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_role_by_name(self, name: str) -> Role | None:
        return self.db.query(Role).filter(Role.name == name).first()

    def create(self, username: str, hashed_password: str, role_id: int) -> User:
        user = User(username=username, hashed_password=hashed_password, role_id=role_id)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_all(self, skip: int = 0, limit: int = 20) -> list[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def set_active(self, user: User, active: bool) -> User:
        user.is_active = active
        self.db.commit()
        self.db.refresh(user)
        return user

    def set_role(self, user: User, role_id: int) -> User:
        user.role_id = role_id
        self.db.commit()
        self.db.refresh(user)
        return user

    def register_failed_attempt(self, user: User, max_intentos: int, bloqueo_minutos: int):
        user.failed_attempts += 1
        if user.failed_attempts >= max_intentos:
            user.locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=bloqueo_minutos)
        self.db.commit()

    def reset_failed_attempts(self, user: User):
        user.failed_attempts = 0
        user.locked_until = None
        self.db.commit()