import { useEffect } from 'react';

/** Moves the spotlight on .tile cards with the cursor. */
export function useTileGlow() {
  useEffect(() => {
    const onMove = (e) => {
      const t = e.target.closest && e.target.closest('.tile');
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', e.clientX - r.left + 'px');
      t.style.setProperty('--my', e.clientY - r.top + 'px');
    };
    document.addEventListener('pointermove', onMove);
    return () => document.removeEventListener('pointermove', onMove);
  }, []);
}
