import { useEffect } from 'react';
import Shield from './Shield.jsx';

const LAYERS = [1, 2, 3, 4, 5];

/** 3D scene: orbits, scan beam, shield + floating info cards. */
export default function Stage({ sceneRef, flipKey, linked, reports, trust }) {
  // replay the flip animation each time a new result arrives
  useEffect(() => {
    if (!flipKey) return;
    const sc = sceneRef.current;
    sc.classList.remove('flip');
    void sc.offsetWidth;
    sc.classList.add('flip');
  }, [flipKey, sceneRef]);

  return (
    <div className="stage" aria-hidden="true">
      <div className="scene" id="scene" ref={sceneRef}>
        <i className="orb o1" /><i className="orb o2" /><i className="beam" />
        {LAYERS.map((i) => (
          <Shield key={i} className="shield layer" style={{ '--z': -i * 11 + 'px', opacity: 0.6 - i * 0.09 }} />
        ))}
        <Shield />
        <div className="fc f1"><small>Linked accounts</small><b id="fl">Found: {linked}</b></div>
        <div className="fc f2"><small>Past reports</small><b id="fr">Found: {reports}</b></div>
        <div className="fc f3"><small>Community trust</small><b id="ft">{trust}</b></div>
      </div>
    </div>
  );
}
