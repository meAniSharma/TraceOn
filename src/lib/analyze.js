/* Rules engine: every point added has a visible reason. */
export const H = 36e5;
export const D = 864e5;
export const DEFAULT_PILL = 'Your digital safety partner';

/** All identities connected to `k` through shared accounts. */
export function cluster(db, k) {
  const set = new Set([k]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const a of db.accounts) {
      if (a.ids.some((i) => set.has(i))) {
        for (const i of a.ids) {
          if (!set.has(i)) { set.add(i); grew = true; }
        }
      }
    }
  }
  return set;
}

export function analyze(db, k) {
  const cl = cluster(db, k);
  const reps = db.reports.filter((r) => cl.has(r.id));
  const linked = [...cl].filter((i) => i !== k && i.startsWith('ig:'));
  const verified = db.accounts.some((a) => a.verified && a.ids.some((i) => cl.has(i)));
  const proofN = reps.filter((r) => r.proof).length;
  const noteN = reps.length - proofN;
  const recent = reps.some((r) => Date.now() - r.ts < 7 * D);
  const why = [];
  let score = 0;
  const add = (p, t) => { score += p; why.push({ p, t }); };

  if (proofN) add(Math.min(proofN * 25, 50), proofN + (proofN > 1 ? ' reports include' : ' report includes') + ' proof from buyers.');
  if (noteN) add(Math.min(noteN * 10, 20), noteN + (noteN > 1 ? ' reports have' : ' report has') + ' no proof attached.');
  if (linked.length >= 2) add(30, 'The same payment ID is linked to ' + linked.length + ' other pages.');
  else if (linked.length === 1) add(15, 'The same payment ID is linked to 1 other page.');
  if (recent) add(10, 'Reported in the last 7 days.');
  if (verified) add(-40, 'Seller verified their payment ID.');
  score = Math.max(0, Math.min(100, score));

  const known = db.accounts.some((a) => a.ids.some((i) => cl.has(i))) || reps.length > 0;
  const lv = !known ? 'grey' : score >= 60 ? 'red' : score >= 30 ? 'amber' : 'green';
  if (!known) why.push({ p: 0, t: 'No reports or linked pages found. That is not a guarantee of safety.' });
  else if (!reps.length && !verified) why.push({ p: 0, t: 'No reports found for this seller.' });

  return { score, lv, why, linked, cl, known, reps };
}

/** Page theme per level: [data-state, pill text, community trust label] */
export const STATE = {
  red: ['danger', 'Scam alert: don’t pay', 'Low'],
  amber: ['amber', 'Proceed with caution', 'Medium'],
  green: ['safe', 'No red flags found', 'High'],
  grey: ['idle', 'Not enough data yet', 'Unknown'],
};

/** [badge label, advice] per level */
export const VERDICT = {
  red: ['High risk', 'Don’t pay in advance.'],
  amber: ['Be careful', 'Ask for cash on delivery or a video call first.'],
  green: ['Low risk', 'No red flags found. Still pay carefully.'],
  grey: ['Not enough data', 'Treat with care.'],
};

/** Nodes shown in the spider-web / molecule demo. */
export function webNodesFor(db, k) {
  const a = analyze(db, k);
  return [...a.cl].slice(0, 5).map((id) => ({
    id,
    rep: a.reps.some((r) => r.id === id),
    n: a.reps.filter((r) => r.id === id).length,
  }));
}

/** Numbers for the four stat counters. */
export function computeStats(db) {
  const ids = new Set(db.accounts.flatMap((a) => a.ids));
  const ig = [...ids].filter((i) => i.startsWith('ig:'));
  return [
    db.reports.length,
    ids.size,
    ig.filter((i) => [...cluster(db, i)].filter((x) => x.startsWith('ig:')).length > 1).length,
    db.accounts.filter((a) => a.verified).length,
  ];
}
