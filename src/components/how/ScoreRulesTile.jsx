import Reveal from '../common/Reveal.jsx';

const RULES = [
  ['Report with proof', '+25 each, max 50'],
  ['Report without proof', '+10 each, max 20'],
  ['Payment ID on 2+ other pages', '+30'],
  ['Reported in last 7 days', '+10'],
  ['Verified seller', '−40'],
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
