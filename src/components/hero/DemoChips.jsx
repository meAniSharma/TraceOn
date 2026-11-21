const DEMOS = [
  { label: 'Scam', color: 'var(--red)', value: 'rahul123@okaxis' },
  { label: 'Caution', color: 'var(--amb)', value: 'gadgetking@paytm' },
  { label: 'Safe', color: 'var(--grn)', value: '@shop_with_trust' },
];

export default function DemoChips({ onPick }) {
  return (
    <div className="demo">
      Try a sample
      {DEMOS.map((d) => (
        <button key={d.label} className="dc" style={{ '--c': d.color }} onClick={() => onPick(d.value)}>
          {d.label}
        </button>
      ))}
    </div>
  );
}
