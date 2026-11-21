/** Normalise user input into a typed key like "upi:name@bank", or null if invalid. */
export function toKey(type, v) {
  v = String(v || '').trim().toLowerCase();
  if (!v) return null;
  if (type === 'ph') {
    const d = v.replace(/\D/g, '').slice(-10);
    return d.length === 10 ? 'ph:' + d : null;
  }
  if (type === 'ig') return 'ig:' + v.replace(/^@/, '').replace(/\s/g, '');
  return /^[\w.\-]+@[a-z]{2,}$/.test(v) ? 'upi:' + v : null;
}

/** Guess the identity type from free text. */
export function detect(v) {
  v = v.trim();
  if (/^\+?[\d\s-]{8,}$/.test(v)) return 'ph';
  if (/^[^@\s]+@[a-zA-Z]{2,}$/.test(v)) return 'upi';
  return 'ig';
}

export const label = (k) => {
  const t = k.slice(0, 2), v = k.slice(3);
  return t === 'ig' ? '@' + v : t === 'ph' ? '+91 ' + v.slice(0, 5) + ' ' + v.slice(5) : v;
};
export const plain = (k) => label(k).replace('+91 ', '');
export const icon = (k) => ({ ig: '📸', upi: '💳', ph: '📞' }[k.slice(0, 2)]);

export function ago(ts) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 6e4));
  return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' hours ago' : Math.round(m / 1440) + ' days ago';
}
