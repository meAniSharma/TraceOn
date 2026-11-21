import Reveal from '../common/Reveal.jsx';

export default function VerifiedTile() {
  return (
    <Reveal className="tile t3" i={1}>
      <div className="badge">✓</div>
      <h3>Honest sellers win too</h3>
      <p>Sellers who confirm their payment ID get a verified badge buyers can trust.</p>
    </Reveal>
  );
}
