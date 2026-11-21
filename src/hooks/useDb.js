import { useCallback, useRef, useState } from 'react';
import { makeSeed } from '../data/seed.js';
import { loadDb, saveDb } from '../lib/storage.js';

/** Holds accounts + reports, persists to localStorage when a report is added. */
export function useDb() {
  const [db, setDb] = useState(() => loadDb() ?? makeSeed());
  const ref = useRef(db);

  /** Adds a report for each id, links ids to one account. Returns the new db. */
  const addReport = useCallback((ids, { proof, note }) => {
    const accounts = ref.current.accounts.map((a) => ({ ...a, ids: [...a.ids] }));
    const hit = accounts.find((a) => a.ids.some((i) => ids.includes(i)));
    if (hit) ids.forEach((i) => { if (!hit.ids.includes(i)) hit.ids.push(i); });
    else accounts.push({ ids });
    const reports = [
      ...ref.current.reports,
      ...ids.map((id) => ({ id, proof, note, ts: Date.now() })),
    ];
    const next = { accounts, reports };
    ref.current = next;
    setDb(next);
    saveDb(next);
    return next;
  }, []);

  return { db, addReport };
}
