const BRANDS = ['Instagram', 'WhatsApp', 'UPI', 'PhonePe', 'Google Pay', 'Paytm', 'BHIM'];

export default function Marquee() {
  return (
    <div className="marq" aria-hidden="true">
      <div className="mt" id="mt">
        {[...BRANDS, ...BRANDS].map((b, i) => <span key={i}>{b}</span>)}
      </div>
    </div>
  );
}
