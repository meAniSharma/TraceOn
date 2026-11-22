/**
 * TraceOn API client
 * All calls go to the Express backend at /api/*
 * Falls back gracefully when the server is unreachable.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  try { return localStorage.getItem('traceon.token') || null; } catch { return null; }
}
function setToken(t) {
  try { if (t) localStorage.setItem('traceon.token', t); else localStorage.removeItem('traceon.token'); } catch {}
}

async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers['Authorization'] = 'Bearer ' + t;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return json;
}

export { getToken, setToken, api };
