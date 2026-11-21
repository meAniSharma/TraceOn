/** The big 3D shield. Used once as the main shield and 5x as depth layers. */
export default function Shield({ className = 'shield', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 230">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--ad)' }} />
        </linearGradient>
      </defs>
      <path d="M100 10 28 38v66c0 50 31 90 72 110 41-20 72-60 72-110V38z" fill="url(#sg)" />
      <g className="gl g-idle">
        <path d="M64 144v-30a36 36 0 0 1 72 0v22" />
        <path d="M80 154v-40a20 20 0 0 1 40 0v20" />
        <path d="M96 164v-50a4 4 0 0 1 8 0v36" />
      </g>
      <g className="gl g-safe"><path d="M64 112l26 26 48-56" /></g>
      <g className="gl g-bad"><path d="M100 70v52M100 148v1" /></g>
    </svg>
  );
}
