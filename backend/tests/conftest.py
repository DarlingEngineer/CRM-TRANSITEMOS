"""Configuración compartida para las pruebas.

Crea una base de datos limpia antes de cada prueba y sustituye la
dependencia get_db para que la API use esa base en vez de la real.
"""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from core.database import Base, get_db
from main import app
from modules.auth.models import Role, User
from modules.auth.security import hash_password

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture()
def db_session():
    """Crea todas las tablas, entrega una sesión limpia, y las borra al final."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    """Cliente HTTP de pruebas contra la app real, usando la BD de pruebas."""
    return TestClient(app)


@pytest.fixture()
def admin_user(db_session):
    """Crea un usuario admin y devuelve (username, password) para hacer login."""
    role = Role(name="admin", description="Acceso total")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    user = User(username="admin_test", hashed_password=hash_password("Test1234!"), role_id=role.id)
    db_session.add(user)
    db_session.commit()
    return "admin_test", "Test1234!"


@pytest.fixture()
def solicitante_user(db_session):
    """Crea un usuario con rol solicitante y devuelve (username, password)."""
    role = Role(name="solicitante", description="Solo puede crear tickets")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    user = User(username="solicitante_test", hashed_password=hash_password("Test1234!"), role_id=role.id)
    db_session.add(user)
    db_session.commit()
    return "solicitante_test", "Test1234!"