"""Pruebas del endpoint de login."""


def test_login_con_credenciales_correctas_devuelve_token(client, admin_user):
    username, password = admin_user
    response = client.post("/auth/login", json={"username": username, "password": password})

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_con_password_incorrecta_devuelve_401(client, admin_user):
    username, _ = admin_user
    response = client.post("/auth/login", json={"username": username, "password": "incorrecta"})

    assert response.status_code == 401


def test_login_con_usuario_inexistente_devuelve_401(client):
    response = client.post("/auth/login", json={"username": "no_existe", "password": "algo"})

    assert response.status_code == 401