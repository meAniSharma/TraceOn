import Reveal from '../common/Reveal.jsx';

const RULES = [
  ['Score 71–100 (Green)', 'Safe & Verified seller'],
  ['Score 41–70 (Yellow)', 'Proceed with caution'],
  ['Score 0–40 (Red)', 'High risk scam alert'],
  ['Verified seller bonus', '+15 Trust boost'],
  ['OCR proof report', '−25 Trust penalty'],
];

export default function ScoreRulesTile() {
  return (
    <Reveal className="tile t2" i={0}>
      <h3>A score you can read</h3>
      <p>No black box. Every point has a reason.</p>
      <ul className="rules">
        {RULES.map(([text, pts]) => <li key={text}>{text}<b>{pts}</b></li>)}
      </ul>
    </Reveal>
  );
}
