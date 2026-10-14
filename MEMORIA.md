# Memoria del proyecto CRM-TRANSITEMOS

Estado al 2026-10-02:

## Servicios y cómo levantarlos
- Postgres (Docker, puerto 5433): `docker compose up -d`
- Backend FastAPI (puerto 8000): `cd backend && .\venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload`
- Frontend Vite (puerto 5173): `cd frontend && npm run dev`
- Usuario admin: `admin` (ver backend/seed_admin.py). La base `crm_db` ya tiene datos.

## Tests
- Requieren `TEST_DATABASE_URL` apuntando a `crm_test` (la BD ya existe en el contenedor: `crm_user:crm_password@localhost:5433/crm_test`).
- Correr: `cd backend && .\venv\Scripts\python -m pytest -q`

## Decisiones y ajustes realizados
- Backend: corregido endpoint `/auth/users/{id}/deactivate` (antes reactivaba), eliminado `change_role` duplicado, agregado `/auth/users/{id}/reactivate`.
- BD: esquema sincronizado manualmente (faltaban `areas`, `tickets.area_id`, `users.is_active/failed_attempts/locked_until`); alembic en `head` (`0e9329aceeac`). OJO: la migración `785142507b99` está mal escrita (columna NOT NULL sin default) — falla en BD nuevas; corregirla si se despliega a otro entorno.
- Frontend: AuthContext montado y usado (login/logout/role/user via /me); ProtectedRoute aplicado; apiClient centraliza fetch con VITE_API_URL + manejo 401; Feedback.jsx unifica loading/errores; EstadoTicketsPage con filtros, paginación y confirmación; página 404; react-query desinstalado; prioridad "Urgente" aceptada en backend y frontend.
- Login devuelve 200 verificado. Tests: 10 passed.
- Módulo Reportes conectado: nueva página `/reportes` (admin) consume `/metrics/tickets-per-month`, `/metrics/tickets-per-area`, `/metrics/response-time`.
- Limpieza de menú: eliminados links a /usuarios, /auditoria, /configuracion y "Status Page" (no existían).
- Nueva página `/usuarios` (admin): crear, cambiar rol, activar/desactivar.
- Tickets: las llamadas al backend ahora piden `limit=100` (antes se truncaban a 20).

## Deuda técnica pendiente
- Implementar auditoría completa (tabla de eventos por ticket) si se requiere para campo.

### Tercera iteración (2026-10-03)
- `SECRET_KEY` real generada y puesta en `.env`.
- Reset de contraseña por admin: `PATCH /auth/users/{id}/password` + botón 🔑 en /usuarios.
- Auditoría básica de tickets: columna `tickets.updated_by` con el usuario que cambió el estado; se muestra en el modal de detalle. Migración `479998aa6142`.
- Tests backend: 13 passed. Docker: stack completo arriba (8000, 8080, 5433).
- Corregir migración `785142507b99` para que sea aplicable desde cero.
- El proxy de Vite quedó configurado pero el frontend usa URLs vía VITE_API_URL.
- Considerar centralizar más fetch con react-query si se quisiera caché (actualmente desinstalado).

Ver detalle completo en `RUTAS_Y_TRAZABILIDAD.md`.

### Puesta a punto final (2026-10-02, tercera iteración)
- Migraciones alembic corregidas (`785142507b99` con server_default, `0e9329aceeac` con backfill de área General) — ahora `alembic upgrade head` funciona desde cero.
- CORS restringido a orígenes de `CORS_ORIGINS` (.env).
- `.gitignore` ampliado (node_modules, dist, logs); `.env` no está trackeado.
- Logging básico en main.py.
- Backend sirve el frontend compilado (`frontend/dist`) en el puerto 8000 (SPA fallback; rutas de API intactas).
- Docker: `Dockerfile` backend (Python), `frontend/Dockerfile` (build + nginx con proxy a backend), compose con db+backend+frontend.
- Tests nuevos: refresh token y CRUD áreas (13 passed).
- `README.md` con instrucciones completas.

### Ajustes de interfaz y área General (2026-10-08)
- Se eliminó el área "General" (artefacto del backfill de `0e9329aceeac`): migración `b7f1c2d3e4a5` borra el área y sus tickets asociados; el frontend ya no usa "General" como respaldo (usa "Sin área").
- Etiqueta del campo de descripción del ticket: "DESCRIPCIÓN / CUERPO" → "DESCRIPCIÓN".
- Gráficos de Dashboard/Reportes con descripción propia (`ChartCard`), etiquetas de valor y tooltips más claros; layout más proporcionado.

