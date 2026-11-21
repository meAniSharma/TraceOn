import { useRef } from 'react';
import { STATE } from '../../lib/analyze.js';
import SearchBar from './SearchBar.jsx';
import DemoChips from './DemoChips.jsx';
import Stage from './Stage.jsx';

export default function Hero({ query, onQueryChange, onCheck, onDemo, tracing, pill, result, flipKey, inputRef }) {
  const sceneRef = useRef(null);
  const a = result?.a;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    if (sceneRef.current) sceneRef.current.style.transform = `rotateY(${x * 26}deg) rotateX(${-y * 18}deg)`;
  };
  const onLeave = () => { if (sceneRef.current) sceneRef.current.style.transform = ''; };

  return (
    <header className="hero" id="top" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="floor" />
      <span className="pill"><i /><span id="pill">{pill}</span></span>
      <h1>Trust the seller.<em>Trace the identity.</em></h1>
      <p className="lead">
        Check an Instagram handle, UPI ID or phone number before you pay, and see every page that shares the same money trail.
      </p>
      <SearchBar value={query} onChange={onQueryChange} onSubmit={onCheck} disabled={tracing} inputRef={inputRef} />
      <DemoChips onPick={onDemo} />
      <Stage
        sceneRef={sceneRef}
        flipKey={flipKey}
        linked={a ? a.linked.length : '–'}
        reports={a ? a.reps.length : '–'}
        trust={a ? STATE[a.lv][2] : '–'}
      />
    </header>
  );
}
