/*
 * TraceOn Auth – backed by the Express API.
 * Falls back to a "server unreachable" error if the API is down.
 */

// In dev, Vite proxies /api → http://localhost:3001, so we use '' (relative).
// In production set VITE_API_URL to your server's origin.
const BASE = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'traceon.token';
const SESSION_KEY = 'traceon.session';

const readLocal = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const writeLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const removeLocal = (k) => { try { localStorage.removeItem(k); } catch {} };

/* ---------- helpers ---------- */
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const firstName = (name = '') => name.trim().split(/\s+/)[0] || 'there';

export function passwordStrength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return p ? Math.max(1, s) : 0;
}
export const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/* ---------- session ---------- */
export const getSession = () => readLocal(SESSION_KEY, null);

function saveSession(user, token) {
  writeLocal(SESSION_KEY, user);
  writeLocal(TOKEN_KEY, token);
}

export function getToken() {
  return readLocal(TOKEN_KEY, null);
}

/* ---------- API calls ---------- */
async function callApi(path, body) {
  try {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'Cannot reach the server. Make sure the backend is running.' };
  }
}

export async function signUp({ name, email, password }) {
  const r = await callApi('/api/auth/signup', { name, email, password });
  if (r.ok) saveSession(r.user, r.token);
  return r;
}

export async function logIn({ email, password }) {
  const r = await callApi('/api/auth/login', { email, password });
  if (r.ok) saveSession(r.user, r.token);
  return r;
}

export function logOut() {
  removeLocal(SESSION_KEY);
  removeLocal(TOKEN_KEY);
}
