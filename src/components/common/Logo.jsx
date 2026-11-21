import { Link } from 'react-router-dom';

export default function Logo() {
  return (
    <Link className="logo" to="/#top" aria-label="TraceOn home">
      <svg width="30" height="30" viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--logo1)" />
            <stop offset="1" stopColor="var(--logo2)" />
          </linearGradient>
        </defs>
        <g fill="url(#lg)">
          <path d="M24 3 42 9v8l-6-3H12l-6 3V9z" />
          <path d="M14 14h20v5h-7.5v22L24 45l-2.5-4V19H14z" />
        </g>
        <g fill="none" stroke="url(#lg)" strokeWidth="5" strokeLinecap="round">
          <path d="M10 24c0 8 4 13 9 16" />
          <path d="M38 24c0 8-4 13-9 16" />
        </g>
      </svg>
      TraceOn
    </Link>
  );
}
