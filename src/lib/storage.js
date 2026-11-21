const KEY = 'traceon.v1';

export function loadDb() {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return JSON.parse(s);
  } catch (e) { /* ignore */ }
  return null;
}

export function saveDb(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
}
