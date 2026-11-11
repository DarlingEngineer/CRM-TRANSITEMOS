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


def test_solicitante_solo_ve_sus_propios_tickets(client, solicitante_user, admin_user, areas):
    ...
    area = areas[0]   # antes: client.get("/areas/", ...).json()[0]["name"]
    sol_token = _login(client, *solicitante_user)
    adm_token = _login(client, *admin_user)
    sol_headers = {"Authorization": f"Bearer {sol_token}"}
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    area = client.get("/areas/", headers=adm_headers).json()[0]["name"]

    def crear(headers, title):
        r = client.post(
            "/tickets/",
            json={"title": title, "body": "detalle", "priority": "Media", "area": area},
            headers=headers,
        )
        assert r.status_code == 200
        return r.json()["id"]

    propio_id = crear(sol_headers, "Ticket del solicitante")
    ajeno_id = crear(adm_headers, "Ticket del admin")

    response = client.get("/tickets/", headers=sol_headers)

    assert response.status_code == 200
    ids = [t["id"] for t in response.json()]
    assert propio_id in ids
    assert ajeno_id not in ids


def test_admin_si_puede_listar_tickets(client, admin_user):
    username, password = admin_user
    token = _login(client, username, password)

    response = client.get("/tickets/", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200


def test_solicitante_puede_crear_ticket(client, solicitante_user, areas):
    username, password = solicitante_user
    token = _login(client, username, password)

    response = client.post(
        "/tickets/",
        json={"title": "Prueba", "priority": "Alta", "area": "Registro Automotor"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

def test_solicitante_no_puede_cambiar_estado(client, solicitante_user, admin_user, areas):
    area = areas[0] 
    sol_token = _login(client, *solicitante_user)
    adm_token = _login(client, *admin_user)
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    area = client.get("/areas/", headers=adm_headers).json()[0]["name"]
    ticket_id = client.post(
        "/tickets/",
        json={"title": "Prueba", "body": "x", "priority": "Media", "area": area},
        headers=adm_headers,
    ).json()["id"]

    r = client.put(
        f"/tickets/{ticket_id}",
        json={"status": "En proceso"},
        headers={"Authorization": f"Bearer {sol_token}"},
    )
    assert r.status_code == 403