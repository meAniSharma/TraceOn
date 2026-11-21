import { useCallback, useRef, useState } from 'react';
import { analyze, DEFAULT_PILL, STATE } from '../lib/analyze.js';
import { detect, toKey } from '../lib/format.js';
import { prefersReducedMotion, sleep } from '../lib/motion.js';

const TRACE_STEPS = ['Checking community reports…', 'Following the payment ID…', 'Linking pages and numbers…'];

/** The "Check now" flow: validate -> fake trace animation -> analyze -> result. */
export function useSellerCheck({ db, showToast }) {
  const [tracing, setTracing] = useState(false);
  const [pill, setPill] = useState(DEFAULT_PILL);
  const [result, setResult] = useState(null); // { k, a, run }
  const [flipKey, setFlipKey] = useState(0);
  const busy = useRef(false);
  const run = useRef(0);

  const check = useCallback(async (raw, dbNow = db) => {
    if (busy.current) return;
    const k = toKey(detect(raw), raw);
    if (!k) {
      showToast('Enter a valid UPI ID (name@bank), handle or 10-digit phone number');
      return;
    }
    busy.current = true;
    setTracing(true);
    for (const t of TRACE_STEPS) {
      setPill(t);
      await sleep(prefersReducedMotion() ? 0 : 550);
    }
    setTracing(false);
    busy.current = false;

    const a = analyze(dbNow, k);
    setPill(STATE[a.lv][1]);
    setFlipKey((n) => n + 1);
    setResult({ k, a, run: ++run.current });
  }, [db, showToast]);

  const reset = useCallback(() => {
    setResult(null);
    setPill(DEFAULT_PILL);
  }, []);

  return { tracing, pill, result, flipKey, check, reset };
}
