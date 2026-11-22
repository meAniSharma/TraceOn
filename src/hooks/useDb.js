import { useCallback, useEffect, useRef, useState } from 'react';
import { makeSeed } from '../data/seed.js';
import { loadDb, saveDb } from '../lib/storage.js';

// In dev, Vite proxies /api → http://localhost:3001
const BASE = import.meta.env.VITE_API_URL ?? '';

async function fetchDb() {
  try {
    const res = await fetch(BASE + '/api/db');
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  return null;
}

async function postReport(ids, { proof, note, proofImage, extractedData }) {
  const res = await fetch(BASE + '/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, proof, note, proofImage, extractedData }),
  });
  if (!res.ok) throw new Error('Server error');
  return (await res.json()).db;
}

async function postVerifySeller(details) {
  const res = await fetch(BASE + '/api/sellers/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to verify seller');
  return data.db;
}

/**
 * Holds accounts + reports.
 * Loads from the API on mount (falls back to localStorage → seed data).
 * Saves reports to the API; updates local state optimistically and
 * persists to localStorage so the page works offline too.
 */
export function useDb() {
  const [db, setDb] = useState(() => loadDb() ?? makeSeed());
  const ref = useRef(db);

  // Fetch fresh data from the server on mount
  useEffect(() => {
    fetchDb().then((data) => {
      if (data) {
        ref.current = data;
        setDb(data);
        saveDb(data);
      }
    });
  }, []);

  /** Adds a report for each id, links ids to one account. Returns the new db. */
  const addReport = useCallback(async (ids, { proof, note, proofImage, extractedData }) => {
    // Optimistic local update (mirrors the server logic)
    const accounts = ref.current.accounts.map((a) => ({ ...a, ids: [...a.ids] }));
    const hit = accounts.find((a) => a.ids.some((i) => ids.includes(i)));
    if (hit) ids.forEach((i) => { if (!hit.ids.includes(i)) hit.ids.push(i); });
    else accounts.push({ ids });
    const ts = Date.now();
    const reports = [
      ...ref.current.reports,
      ...ids.map((id) => ({ id, proof, note, proofImage, extractedData, ts })),
    ];
    const optimistic = { accounts, reports };
    ref.current = optimistic;
    setDb(optimistic);
    saveDb(optimistic);

    // Sync with the server in the background
    try {
      const serverDb = await postReport(ids, { proof, note, proofImage, extractedData });
      ref.current = serverDb;
      setDb(serverDb);
      saveDb(serverDb);
      return serverDb;
    } catch {
      // Keep the optimistic update if the server is unreachable
      return optimistic;
    }
  }, []);

  /** Registers a seller as verified, giving them a high trust rating in green */
  const verifySeller = useCallback(async ({ name, ig, upi, ph }) => {
    // Generate identity keys
    const ids = [];
    if (ig) {
      const cleanIg = String(ig).trim().replace(/^@/, '').replace(/\s/g, '').toLowerCase();
      if (cleanIg) ids.push(`ig:${cleanIg}`);
    }
    if (upi) {
      const cleanUpi = String(upi).trim().toLowerCase();
      if (/^[\w.\-]+@[a-z]{2,}$/.test(cleanUpi)) ids.push(`upi:${cleanUpi}`);
    }
    if (ph) {
      const cleanPh = String(ph).replace(/\D/g, '').slice(-10);
      if (cleanPh.length === 10) ids.push(`ph:${cleanPh}`);
    }

    if (!ids.length) {
      return { ok: false, error: 'Provide at least one valid Instagram, UPI, or Phone' };
    }

    // Optimistic update
    const accounts = ref.current.accounts.map((a) => ({ ...a, ids: [...a.ids] }));
    const hit = accounts.find((a) => a.ids.some((i) => ids.includes(i)));
    if (hit) {
      hit.verified = true;
      if (name) hit.name = name.trim();
      ids.forEach((i) => { if (!hit.ids.includes(i)) hit.ids.push(i); });
    } else {
      accounts.unshift({ ids, verified: true, name: name?.trim() || undefined });
    }
    const optimistic = { accounts, reports: ref.current.reports };
    ref.current = optimistic;
    setDb(optimistic);
    saveDb(optimistic);

    try {
      const serverDb = await postVerifySeller({ name, ig, upi, ph, ids });
      ref.current = serverDb;
      setDb(serverDb);
      saveDb(serverDb);
      return { ok: true, db: serverDb, primaryId: ids[0] };
    } catch {
      return { ok: true, db: optimistic, primaryId: ids[0] };
    }
  }, []);

  return { db, addReport, verifySeller };
}
