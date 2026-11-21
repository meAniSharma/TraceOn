import { useCallback, useEffect, useState } from 'react';

export function useTheme() {
  const [mode, setMode] = useState(() =>
    matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'
  );
  useEffect(() => { document.documentElement.dataset.mode = mode; }, [mode]);
  const toggle = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), []);
  return [mode, toggle];
}
