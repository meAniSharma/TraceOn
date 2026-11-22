/* Rules engine: trust score & color ranges: 0-40 red, 41-70 yellow, 71-100 green */
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
  const known = db.accounts.some((a) => a.ids.some((i) => cl.has(i))) || reps.length > 0;

  const proofN = reps.filter((r) => r.proof).length;
  const ocrN = reps.filter((r) => r.extractedData && (r.extractedData.upiIds?.length || r.extractedData.phones?.length || r.extractedData.amounts?.length)).length;
  const noteN = reps.length - proofN;
  const recent = reps.some((r) => Date.now() - r.ts < 7 * D);

  const why = [];
  let score = 0;
  const add = (p, t) => { score += p; why.push({ p, t }); };

  if (verified) {
    // Verified sellers start with high trust (80 base + 15 verified bonus = 95 Green)
    score = 80;
    add(15, 'Verified Seller: official business & payment identity confirmed.');
  } else if (known && !reps.length) {
    // Known account without reports starts with good rating
    score = 75;
    add(0, 'Registered account with no buyer complaints.');
  } else if (known) {
    // Known account with complaints starts lower
    score = 65;
  } else {
    score = 0;
  }

  // Deductions for scam signals & community complaints
  if (ocrN) {
    add(-Math.min(ocrN * 25, 45), `${ocrN} report${ocrN > 1 ? 's have' : ' has'} genuine OCR-extracted receipt evidence.`);
  }
  if (proofN) {
    add(-Math.min(proofN * 15, 30), `${proofN} report${proofN > 1 ? 's include' : ' includes'} payment/chat proof from buyers.`);
  }
  if (noteN) {
    add(-Math.min(noteN * 10, 20), `${noteN} report${noteN > 1 ? 's have' : ' has'} no proof attached.`);
  }
  if (linked.length >= 2) {
    add(-20, `The same payment ID is linked to ${linked.length} other pages.`);
  } else if (linked.length === 1) {
    add(-10, 'The same payment ID is linked to 1 other page.');
  }
  if (recent) {
    add(-10, 'Reported recently in the last 7 days.');
  }

  score = Math.max(0, Math.min(100, score));

  // Determine Level strictly based on user's range:
  // 0-40: red
  // 41-70: yellow (amber)
  // 71-100: green
  let lv = 'grey';
  if (known) {
    if (score <= 40) lv = 'red';
    else if (score <= 70) lv = 'amber';
    else lv = 'green';
  }

  if (!known) {
    why.push({ p: 0, t: 'No reports or verified accounts found. That is not a guarantee of safety.' });
  } else if (!reps.length && !verified) {
    why.push({ p: 0, t: 'No negative reports found for this seller.' });
  }

  return { score, lv, why, linked, cl, known, reps, verified };
}

/** Page theme per level: [data-state, pill text, community trust label] */
export const STATE = {
  red: ['danger', 'Scam alert: high risk (0–40)', 'Low trust'],
  amber: ['amber', 'Proceed with caution (41–70)', 'Medium trust'],
  green: ['safe', 'Verified & Safe (71–100)', 'High trust'],
  grey: ['idle', 'Not enough data yet', 'Unknown'],
};

/** [badge label, advice] per level */
export const VERDICT = {
  red: ['High risk · 0–40', 'Don’t pay in advance. Scam reports attached.'],
  amber: ['Proceed with caution · 41–70', 'Ask for cash on delivery or a video call first.'],
  green: ['Verified & Safe · 71–100', 'Good standing. Trustworthy seller.'],
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
