const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(path, { method = 'GET', body, headers = {}, ...rest } = {}, _retried = false) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  // Token expirado: intenta renovar con refresh_token una sola vez
  if (res.status === 401 && !_retried && !path.startsWith('/auth/')) {
    const ok = await tryRefreshToken();
    if (ok) return apiFetch(path, { method, body, headers, ...rest }, true);
  }

  // Sesión expirada o inválida: limpiar y volver al login
  if (res.status === 401 && !path.startsWith('/auth/login')) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  return res;
}

export default API_URL;
