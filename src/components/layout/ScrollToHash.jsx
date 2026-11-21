import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls to #anchors (also when arriving from another page) and to the top on page changes. */
export default function ScrollToHash() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const el = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
