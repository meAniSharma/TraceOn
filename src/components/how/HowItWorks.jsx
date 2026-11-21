import { useMemo } from 'react';
import { computeStats, webNodesFor } from '../../lib/analyze.js';
import Reveal from '../common/Reveal.jsx';
import WebTile from './WebTile.jsx';
import ScoreRulesTile from './ScoreRulesTile.jsx';
import VerifiedTile from './VerifiedTile.jsx';
import StatsTile from './StatsTile.jsx';

export default function HowItWorks({ db, onPick }) {
  const nodes = useMemo(() => webNodesFor(db, 'upi:rahul123@okaxis'), [db]);
  const stats = useMemo(() => computeStats(db), [db]);

  return (
    <section className="sec" id="how">
      <Reveal as="h2" i={0}>Scammers can rename a page. They can’t rename the payment ID.</Reveal>
      <Reveal as="p" className="sub" i={1}>
        TraceOn links every page, number and UPI ID on the same payment trail, then scores it with rules you can read.
      </Reveal>
      <div className="bento">
        <WebTile nodes={nodes} onPick={onPick} />
        <ScoreRulesTile />
        <VerifiedTile />
        <StatsTile stats={stats} />
      </div>
    </section>
  );
}
