import { useCallback, useEffect, useRef, useState } from 'react';
import { STATE } from '../lib/analyze.js';
import { plain } from '../lib/format.js';
import { useDb } from '../hooks/useDb.js';
import { useSellerCheck } from '../hooks/useSellerCheck.js';
import { useTileGlow } from '../hooks/useTileGlow.js';
import { useToast } from '../context/ToastContext.jsx';

import Hero from '../components/hero/Hero.jsx';
import ResultCard from '../components/result/ResultCard.jsx';
import Marquee from '../components/marquee/Marquee.jsx';
import HowItWorks from '../components/how/HowItWorks.jsx';
import ReportsLedger from '../components/reports/ReportsLedger.jsx';
import VerifiedSellers from '../components/sellers/VerifiedSellers.jsx';
import ReportSection from '../components/report/ReportSection.jsx';
import CallToAction from '../components/cta/CallToAction.jsx';

export default function HomePage() {
  const { db, addReport, verifySeller } = useDb();
  const { showToast } = useToast();
  const { tracing, pill, result, flipKey, check, reset } = useSellerCheck({ db, showToast });

  const [query, setQuery] = useState('');
  const [prefill, setPrefill] = useState(null);
  const inputRef = useRef(null);
  const resultRef = useRef(null);

  useTileGlow();

  // page-wide theme: data-state (safe / amber / danger) and the .tracing class drive the CSS
  useEffect(() => {
    document.documentElement.dataset.state = result ? STATE[result.a.lv][0] : '';
  }, [result]);
  useEffect(() => {
    document.documentElement.classList.toggle('tracing', tracing);
  }, [tracing]);
  useEffect(() => () => {
    document.documentElement.dataset.state = '';
    document.documentElement.classList.remove('tracing');
  }, []);

  // scroll to the result card when a new check finishes
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [result?.run]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Fill the search box with an identity, jump to the top and run a check. */
  const lookup = useCallback((value, dbNow) => {
    setQuery(value);
    location.hash = 'top';
    check(value, dbNow);
  }, [check]);

  const handleQueryChange = (v) => {
    setQuery(v);
    if (!v && result) reset();
  };

  const handleReportSubmit = async (ids, details) => {
    showToast('Report submitted. Thank you.');
    const next = await addReport(ids, details);
    lookup(plain(ids[0]), next);
  };

  const handleVerifySeller = async (details) => {
    const res = await verifySeller(details);
    if (res.ok) {
      showToast(`Seller "${details.name || 'Store'}" verified with Green rating (71–100)!`);
      if (res.primaryId) {
        lookup(plain(res.primaryId), res.db);
      }
    } else {
      showToast(res.error || 'Failed to verify seller');
    }
  };

  const k = result?.k;
  return (
    <>
      <Hero
        query={query}
        onQueryChange={handleQueryChange}
        onCheck={(v) => check(v)}
        onDemo={lookup}
        tracing={tracing}
        pill={pill}
        result={result}
        flipKey={flipKey}
        inputRef={inputRef}
      />

      <div className="rw">
        <div id="result" ref={resultRef} aria-live="polite" style={{ display: result ? 'block' : 'none' }}>
          {result && (
            <ResultCard
              key={result.run}
              k={k}
              a={result.a}
              onPick={(id) => lookup(plain(id))}
              onReport={() => {
                setPrefill({ type: k.slice(0, 2), value: plain(k), n: Date.now() });
                location.hash = 'report';
              }}
              onAgain={() => {
                setQuery('');
                reset();
                location.hash = 'top';
                inputRef.current?.focus();
              }}
            />
          )}
        </div>
      </div>

      <Marquee />
      <HowItWorks db={db} onPick={lookup} />
      <ReportsLedger db={db} onPick={lookup} />
      <VerifiedSellers db={db} onPick={lookup} onVerifySeller={handleVerifySeller} />
      <ReportSection prefill={prefill} onSubmit={handleReportSubmit} showToast={showToast} />
      <CallToAction />
    </>
  );
}
