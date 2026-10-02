"""Pruebas de control de acceso por rol en el módulo de tickets."""


def _login(client, username, password):
    response = client.post("/auth/login", json={"username": username, "password": password})
    return response.json()["access_token"]


def test_solicitante_puede_crear_ticket(client, solicitante_user):
    username, password = solicitante_user
    token = _login(client, username, password)

    response = client.post(
        "/tickets/",
        json={"title": "Prueba", "priority": "Alta", "area": "Registro Automotor"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200


def test_solicitante_no_puede_listar_tickets(client, solicitante_user):
    username, password = solicitante_user
    token = _login(client, username, password)

    response = client.get("/tickets/", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403


def test_admin_si_puede_listar_tickets(client, admin_user):
    username, password = admin_user
    token = _login(client, username, password)

    response = client.get("/tickets/", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200


def test_solicitante_puede_crear_ticket(client, solicitante_user, area_registro):
    username, password = solicitante_user
    token = _login(client, username, password)

    response = client.post(
        "/tickets/",
        json={"title": "Prueba", "priority": "Alta", "area": "Registro Automotor"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200