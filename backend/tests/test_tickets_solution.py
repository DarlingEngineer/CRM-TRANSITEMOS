"""Pruebas del campo solution en tickets."""


def _login(client, username, password):
    r = client.post("/auth/login", json={"username": username, "password": password})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _crear_ticket(client, headers):
    r = client.post(
        "/tickets/",
        json={"title": "x", "priority": "Alta", "area": "Registro Automotor"},
        headers=headers,
    )
    assert r.status_code == 200
    return r.json()


def test_resolver_sin_solucion_es_422(client, admin_user, area_registro):
    headers = _login(client, *admin_user)
    t = _crear_ticket(client, headers)
    r = client.put(f"/tickets/{t['id']}", json={"status": "Resuelto"}, headers=headers)
    assert r.status_code == 422


def test_resolver_con_solucion_la_guarda(client, admin_user, area_registro):
    headers = _login(client, *admin_user)
    t = _crear_ticket(client, headers)
    r = client.put(
        f"/tickets/{t['id']}",
        json={"status": "Resuelto", "solution": "  Se corrigió el dato  "},
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["solution"] == "Se corrigió el dato"


def test_cerrar_conserva_la_solucion(client, admin_user, area_registro):
    headers = _login(client, *admin_user)
    t = _crear_ticket(client, headers)
    client.put(f"/tickets/{t['id']}", json={"status": "Resuelto", "solution": "Listo"}, headers=headers)
    r = client.put(f"/tickets/{t['id']}", json={"status": "Cerrado"}, headers=headers)
    assert r.json()["solution"] == "Listo"


def test_historial_guarda_la_solucion_de_cada_cambio(client, admin_user, area_registro):
    headers = _login(client, *admin_user)
    t = _crear_ticket(client, headers)
    client.put(f"/tickets/{t['id']}", json={"status": "Resuelto", "solution": "Primera"}, headers=headers)
    client.put(f"/tickets/{t['id']}", json={"status": "En proceso"}, headers=headers)
    client.put(f"/tickets/{t['id']}", json={"status": "Resuelto", "solution": "Segunda"}, headers=headers)

    h = client.get(f"/tickets/{t['id']}/history", headers=headers).json()
    assert [e["solution"] for e in h if e["solution"]] == ["Primera", "Segunda"]


def test_editar_prioridad(client, admin_user, area_registro):
    headers = _login(client, *admin_user)
    t = _crear_ticket(client, headers)
    r = client.patch(f"/tickets/{t['id']}", json={"priority": "Baja"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["priority"] == "Baja"
    assert r.json()["status"] == "Abierto"


def test_prioridad_invalida_es_422(client, admin_user, area_registro):
    headers = _login(client, *admin_user)
    t = _crear_ticket(client, headers)
    assert client.patch(f"/tickets/{t['id']}", json={"priority": "Critica"}, headers=headers).status_code == 422


def test_guardar_solucion_sin_cambiar_estado(client, admin_user, area_registro):
    headers = _login(client, *admin_user)
    t = _crear_ticket(client, headers)
    r = client.patch(f"/tickets/{t['id']}", json={"solution": "  Se reinició el equipo "}, headers=headers)
    assert r.status_code == 200
    assert r.json()["solution"] == "Se reinició el equipo"
    assert r.json()["status"] == "Abierto"


def test_patch_vacio_es_422(client, admin_user, area_registro):
    headers = _login(client, *admin_user)
    t = _crear_ticket(client, headers)
    assert client.patch(f"/tickets/{t['id']}", json={}, headers=headers).status_code == 422


def test_solicitante_no_puede_editar(client, solicitante_user, admin_user, area_registro):
    adm = _login(client, *admin_user)
    t = _crear_ticket(client, adm)
    sol = _login(client, *solicitante_user)
    assert client.patch(f"/tickets/{t['id']}", json={"priority": "Baja"}, headers=sol).status_code == 403


def test_editar_ticket_inexistente_es_404(client, admin_user):
    headers = _login(client, *admin_user)
    assert client.patch("/tickets/99999", json={"priority": "Baja"}, headers=headers).status_code == 404