import Reveal from '../common/Reveal.jsx';
import SpiderWeb from './SpiderWeb.jsx';

export default function WebTile({ nodes, onPick }) {
  return (
    <Reveal className="tile t1" i={2}>
      <h3>Follow the money, not the page name.</h3>
      <p>
        A live web spun from one reported payment ID. Every thread is a page or number that reused it. Drag to rotate, tap a node
        to check it, or open the detail view to see how many reports sit behind each one.
      </p>
      <SpiderWeb nodes={nodes} onPick={onPick} />
    </Reveal>
  );
}
