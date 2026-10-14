# Rutas y trazabilidad

## Rutas del frontend (React Router)

| Ruta | Página | Protegida | Rol |
|------|--------|-----------|-----|
| `/` | Redirige a `/login` | No | — |
| `/login` | LoginPage | No | — |
| `/dashboard` | DashboardPage (KPIs + recharts) | Sí | todos |
| `/tickets` | EstadoTicketsPage (filtros, búsqueda, paginación, modal detalle) | Sí | todos |
| `/generar-ticket` y `/crear-ticket` | GenerarTicketPage | Sí | todos |
| `/reportes` | ReportesPage (recharts + export CSV) | Sí | admin (menú) |
| `/areas` | AreasPage (CRUD áreas) | Sí | admin (menú) |
| `/usuarios` | UsuariosPage (crear, cambiar rol, activar/desactivar) | Sí | admin (menú) |
| `*` | NotFoundPage (404) | No | — |

## Endpoints backend


| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| POST | /auth/login | Login, devuelve access + refresh | público |
| POST | /auth/refresh | Renueva tokens con refresh_token | público |
| POST/GET | /auth/users | CRUD usuarios | admin |
| PATCH | /auth/users/{id}/deactivate | Desactivar | admin |
| PATCH | /auth/users/{id}/reactivate | Reactivar | admin |
| PATCH | /auth/users/{id}/role | Cambiar rol | admin |
| POST/GET/PUT | /tickets/ | Tickets | según rol |
| GET/POST/DELETE | /areas/ | CRUD áreas | GET todos, POST/DELETE admin |
| GET | /metrics/tickets-per-month | Reporte mensual | admin |
| GET | /metrics/tickets-per-area | Reporte por área | admin |
| GET | /metrics/response-time | Tiempo promedio resolución | admin |
| GET | /me | Usuario actual desde el token | autenticado |

## Cambios realizados (2026-10-02, segunda iteración)

1. **recharts** instalado: dashboard (dona de estados + barras de prioridad) y reportes usan gráficos reales.
2. **Toasts**: nuevo `ToastContext` con `useToast()`; usado en crear ticket y cambiar estado.
3. **Búsqueda** de tickets por título/ID en EstadoTicketsPage.
4. **Modal de detalle** al hacer clic en una fila de ticket.
5. **Modo oscuro**: botón en el sidebar, persiste en localStorage.
6. **CRUD Áreas**: endpoints `/areas/` en backend + página `/areas` (admin); el formulario de ticket ahora lista áreas reales (antes listaba usuarios por error).
7. **Exportar CSV** en ReportesPage (tickets por mes).
8. **Badge** con conteo de tickets abiertos en el menú lateral.
9. **Tests frontend**: Vitest configurado (`src/components/Feedback.test.jsx`, script `npm test`).
10. **Refresh automático de token**: `apiClient` reintenta con `/auth/refresh` antes de cerrar sesión; `AuthContext` guarda `refresh_token`.
11. **Responsive**: sidebar se estrecha en pantallas < 768px.
12. **Proxy Vite**: agregados `/areas` y `/metrics`.

## Estado de verificación
- Backend: 10/10 tests pytest pasan; login, refresh y /areas responden 200.
- Frontend: `vite build` OK; `vitest run` 4/4 tests pasan.

## Cambios realizados (2026-10-08)
1. **Área "General" eliminada**: nueva migración `b7f1c2d3e4a5_eliminar_area_general.py` (borra los tickets asignados a "General" y el área). En el frontend se quitaron los respaldos `General` (formulario de ticket y listado/detalle de tickets ahora usan "Sin área").
2. **Campo de descripción de ticket**: la etiqueta "DESCRIPCIÓN / CUERPO" del formulario pasó a llamarse solo "DESCRIPCIÓN".
3. **Dashboard y Reportes**: nuevo componente `ChartCard` (título + descripción por gráfico), descripciones en los KPIs, etiquetas de valor y tooltips con unidades; layout centrado (`max-width 1320px`) y grillas más proporcionales.

