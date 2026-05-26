/**
 * apiFetch – thin wrapper around fetch() that:
 *   1. Automatically reads the JWT from localStorage and adds
 *      an "Authorization: Bearer <token>" header.
 *   2. If the server responds with 401 (expired / invalid token),
 *      it clears auth data from localStorage and redirects to /login.
 *
 * Usage: drop-in replacement for fetch() in authenticated calls.
 *   const res = await apiFetch('/api/trips');
 *   const res = await apiFetch('/api/trips', { method: 'POST', body: JSON.stringify(data) });
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token expired or invalid – clear local auth and redirect
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return response;
  }

  return response;
}
