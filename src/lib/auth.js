/*
 * DEMO AUTH — front-end only.
 * Accounts live in this browser's localStorage and passwords are stored as a salted SHA-256 hash.
 * That is fine for a prototype, but NOT secure authentication. Before going live, replace the
 * three functions below (signUp, logIn, logOut) with calls to a real backend / auth provider.
 */
const USERS = 'traceon.users';
const SESSION = 'traceon.session';

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure context required');
  const data = new TextEncoder().encode(salt + ':' + password);
  return hex(await crypto.subtle.digest('SHA-256', data));
}
const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));

/* ---------- validation helpers ---------- */
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
export const getSession = () => read(SESSION, null);

/* ---------- API-shaped functions (swap these for a backend) ---------- */
export async function signUp({ name, email, password }) {
  try {
    const users = read(USERS, []);
    const e = email.trim().toLowerCase();
    if (users.some((u) => u.email === e)) return { ok: false, error: 'An account with this email already exists. Try logging in.' };
    const salt = newSalt();
    const user = { id: crypto.randomUUID?.() ?? salt, name: name.trim(), email: e, salt, hash: await hashPassword(password, salt), createdAt: Date.now() };
    if (!write(USERS, [...users, user])) return { ok: false, error: 'Your browser blocked storage, so the account couldn’t be saved.' };
    const session = { id: user.id, name: user.name, email: user.email };
    write(SESSION, session);
    return { ok: true, user: session };
  } catch {
    return { ok: false, error: 'Account creation needs a secure (https or localhost) connection.' };
  }
}

export async function logIn({ email, password }) {
  try {
    const u = read(USERS, []).find((x) => x.email === email.trim().toLowerCase());
    const bad = { ok: false, error: 'Incorrect email or password.' };
    if (!u) return bad;
    if ((await hashPassword(password, u.salt)) !== u.hash) return bad;
    const session = { id: u.id, name: u.name, email: u.email };
    write(SESSION, session);
    return { ok: true, user: session };
  } catch {
    return { ok: false, error: 'Logging in needs a secure (https or localhost) connection.' };
  }
}

export function logOut() {
  try { localStorage.removeItem(SESSION); } catch { /* ignore */ }
}
