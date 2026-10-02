"""Pruebas de gestión de usuarios (solo accesible para admin)."""


def _login(client, username, password):
    response = client.post("/auth/login", json={"username": username, "password": password})
    return response.json()["access_token"]


def test_admin_puede_crear_usuario(client, admin_user, db_session):
    from modules.auth.models import Role
    db_session.add(Role(name="tecnico", description="Gestiona tickets"))
    db_session.commit()

    username, password = admin_user
    token = _login(client, username, password)

    response = client.post(
        "/auth/users",
        json={"username": "tecnico_nuevo", "password": "Test1234!", "role": "tecnico"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["username"] == "tecnico_nuevo"


def test_solicitante_no_puede_crear_usuarios(client, solicitante_user):
    username, password = solicitante_user
    token = _login(client, username, password)

    response = client.post(
        "/auth/users",
        json={"username": "otro", "password": "Test1234!", "role": "tecnico"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_usuario_desactivado_no_puede_hacer_login(client, admin_user, db_session):
    from modules.auth.models import User, Role
    from modules.auth.security import hash_password

    role = Role(name="tecnico", description="Gestiona tickets")
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)

    user = User(username="inactivo", hashed_password=hash_password("Test1234!"), role_id=role.id, is_active=False)
    db_session.add(user)
    db_session.commit()

    response = client.post("/auth/login", json={"username": "inactivo", "password": "Test1234!"})

    assert response.status_code == 403