/**
 * TraceOn Backend Server
 * Express + Node built-in SQLite (node:sqlite, Node 22.5+) + JWT auth + OCR
 *
 * Start: node --experimental-sqlite index.js
 */

'use strict';

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { DatabaseSync } = require('node:sqlite');
const { createWorker } = require('tesseract.js');

const isVercel = Boolean(process.env.VERCEL);
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'traceon-dev-secret-change-in-prod';
const DB_PATH = isVercel ? path.join('/tmp', 'traceon.db') : path.join(__dirname, 'traceon.db');
const UPLOADS_DIR = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Multer setup (disk storage, images only, max 5 MB) ──────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/'))
      return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

// ─── Database setup ───────────────────────────────────────────────────────────
const db = new DatabaseSync(DB_PATH);
db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    hash       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id       TEXT PRIMARY KEY,
    verified INTEGER NOT NULL DEFAULT 0,
    name     TEXT
  );

  CREATE TABLE IF NOT EXISTS account_ids (
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    identity   TEXT NOT NULL,
    PRIMARY KEY (account_id, identity)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id             TEXT PRIMARY KEY,
    identity       TEXT NOT NULL,
    proof          INTEGER NOT NULL DEFAULT 0,
    note           TEXT,
    proof_image    TEXT,
    ocr_text       TEXT,
    extracted_data TEXT,
    ts             INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_account_ids_identity ON account_ids(identity);
  CREATE INDEX IF NOT EXISTS idx_reports_identity ON reports(identity);
`);

// Add OCR columns to existing reports table (safe migration)
try {
  db.exec(`ALTER TABLE reports ADD COLUMN proof_image TEXT`);
  db.exec(`ALTER TABLE reports ADD COLUMN ocr_text TEXT`);
  db.exec(`ALTER TABLE reports ADD COLUMN extracted_data TEXT`);
} catch { /* columns already exist */ }

// ─── Seed demo data if empty ──────────────────────────────────────────────────
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM accounts').get();
  if (count.c > 0) return;

  const H = 36e5, D = 864e5, now = Date.now();
  const insAcc = db.prepare('INSERT INTO accounts (id, verified, name) VALUES (?, ?, ?)');
  const insId  = db.prepare('INSERT INTO account_ids (account_id, identity) VALUES (?, ?)');
  const insRep = db.prepare('INSERT INTO reports (id, identity, proof, note, ts) VALUES (?, ?, ?, ?, ?)');

  const seed = [
    { id: 'acc1', ids: ['ig:trendy_store123', 'upi:rahul123@okaxis', 'ph:9876543210'], verified: 0, name: null },
    { id: 'acc2', ids: ['ig:fashion_deals_01', 'upi:rahul123@okaxis'], verified: 0, name: null },
    { id: 'acc3', ids: ['ig:premium_store', 'upi:rahul123@okaxis'], verified: 0, name: null },
    { id: 'acc4', ids: ['ig:shop_with_trust', 'upi:trustshop@oksbi'], verified: 1, name: 'Shop With Trust' },
    { id: 'acc5', ids: ['ig:glow_cosmetics_in', 'upi:glowpay@ybl'], verified: 1, name: 'Glow Cosmetics' },
    { id: 'acc6', ids: ['ig:cheap_gadgets_hub', 'upi:gadgetking@paytm', 'ph:9123456780'], verified: 0, name: null },
  ];
  const seedReports = [
    { identity: 'ig:trendy_store123',   proof: 1, note: 'Paid in advance, got blocked.',           ts: now - 2 * H },
    { identity: 'upi:rahul123@okaxis',  proof: 1, note: 'Same UPI under a new page name.',         ts: now - 3 * D },
    { identity: 'ph:9876543210',        proof: 0, note: 'Never delivered.',                        ts: now - 5 * H },
    { identity: 'ig:fashion_deals_01',  proof: 1, note: 'Receipt attached, no delivery.',          ts: now - 9 * D },
    { identity: 'upi:gadgetking@paytm', proof: 0, note: 'Asked for full payment first.',           ts: now - 3 * H },
  ];
  for (const a of seed) {
    insAcc.run(a.id, a.verified, a.name);
    for (const identity of a.ids) insId.run(a.id, identity);
  }
  for (const r of seedReports) insRep.run(newId(), r.identity, r.proof, r.note, r.ts);
  console.log('✓ Seeded demo data');
}

// ─── OCR helpers ──────────────────────────────────────────────────────────────

/**
 * Extract payment-relevant entities from raw OCR text.
 * Returns { upiIds, phones, amounts, igHandles, rawText }
 */
function extractEntities(text) {
  const upiIds    = [...new Set(text.match(/[\w.\-]+@[a-z]{2,}/gi) || [])].map(s => s.toLowerCase());
  const phones    = [...new Set((text.match(/(?<!\d)(\+91[-\s]?)?[6-9]\d{9}(?!\d)/g) || [])
                      .map(s => s.replace(/\D/g, '').slice(-10)))];
  const amounts   = [...new Set(text.match(/(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d{1,2})?/gi) || [])];
  const igHandles = [...new Set((text.match(/@[a-zA-Z0-9_.]{3,30}/g) || []).map(s => s.toLowerCase()))];

  return { upiIds, phones, amounts, igHandles, rawText: text.trim() };
}

/**
 * Run Tesseract OCR on a file path, return extracted entities.
 * Uses English + Hindi language pack for better Indian-context results.
 */
async function runOcr(filePath) {
  const worker = await createWorker('eng', 1, {
    logger: () => {}, // silence progress logs
    errorHandler: () => {},
  });
  try {
    const { data: { text } } = await worker.recognize(filePath);
    return extractEntities(text);
  } finally {
    await worker.terminate();
  }
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
function newId() { return crypto.randomUUID(); }

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Not authenticated' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ ok: false, error: 'Session expired. Please log in again.' }); }
}

function loadDb() {
  const accountRows = db.prepare('SELECT * FROM accounts').all();
  const idRows      = db.prepare('SELECT * FROM account_ids').all();
  const reportRows  = db.prepare('SELECT * FROM reports ORDER BY ts DESC').all();

  const accounts = accountRows.map((a) => ({
    ids:      idRows.filter((r) => r.account_id === a.id).map((r) => r.identity),
    verified: a.verified === 1,
    name:     a.name || undefined,
  }));

  const reports = reportRows.map((r) => ({
    id:            r.identity,
    proof:         r.proof === 1,
    note:          r.note,
    ts:            r.ts,
    proofImage:    r.proof_image || null,
    extractedData: r.extracted_data ? JSON.parse(r.extracted_data) : null,
  }));

  return { accounts, reports };
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve uploaded proof images
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Signup ─────────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ ok: false, error: 'name, email and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters.' });

    const e = email.trim().toLowerCase();
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(e))
      return res.status(409).json({ ok: false, error: 'An account with this email already exists. Try logging in.' });

    const hash = await bcrypt.hash(password, 10);
    const id = newId();
    db.prepare('INSERT INTO users (id, name, email, hash, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, name.trim(), e, hash, Date.now());

    const user = { id, name: name.trim(), email: e };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user, token });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ ok: false, error: 'Server error. Try again.' });
  }
});

// ── Login ──────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ ok: false, error: 'Email and password are required.' });

    const e = email.trim().toLowerCase();
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(e);
    if (!u || !(await bcrypt.compare(password, u.hash)))
      return res.status(401).json({ ok: false, error: 'Incorrect email or password.' });

    const user = { id: u.id, name: u.name, email: u.email };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, user, token });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ ok: false, error: 'Server error. Try again.' });
  }
});

// ── DB snapshot ────────────────────────────────────────────────────────────
app.get('/api/db', (_req, res) => res.json(loadDb()));

// ── Proof image upload + OCR ───────────────────────────────────────────────
// POST /api/ocr   multipart/form-data  field: "proof"
// Returns { ok, imageUrl, extracted: { upiIds, phones, amounts, igHandles, rawText } }
app.post('/api/ocr', upload.single('proof'), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ ok: false, error: 'No image uploaded.' });

  try {
    console.log(`OCR running on ${req.file.filename}…`);
    const extracted = await runOcr(req.file.path);
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log(`OCR done. Found ${extracted.upiIds.length} UPI, ${extracted.phones.length} phones, ${extracted.amounts.length} amounts`);
    res.json({ ok: true, imageUrl, extracted });
  } catch (err) {
    console.error('OCR error', err);
    // Even if OCR fails, we still have the image
    res.json({ ok: true, imageUrl: `/uploads/${req.file.filename}`, extracted: null, ocrError: 'OCR failed, image saved.' });
  }
});

// ── Reports: list ──────────────────────────────────────────────────────────
app.get('/api/reports', (_req, res) => {
  res.json({ ok: true, reports: loadDb().reports });
});

// ── Reports: submit ────────────────────────────────────────────────────────
// Body: { ids, proof, note, proofImage?, extractedData? }
app.post('/api/reports', (req, res) => {
  try {
    const { ids, proof, note, proofImage, extractedData } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ ok: false, error: 'ids must be a non-empty array.' });

    const ts = Date.now();
    const insert = db.prepare(
      'INSERT INTO reports (id, identity, proof, note, proof_image, ocr_text, extracted_data, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insLink = db.prepare('INSERT OR IGNORE INTO account_ids (account_id, identity) VALUES (?, ?)');
    const insAcc  = db.prepare('INSERT OR IGNORE INTO accounts (id, verified, name) VALUES (?, 0, NULL)');

    // Find or create an account that links all ids
    let accountId = null;
    for (const identity of ids) {
      const row = db.prepare('SELECT account_id FROM account_ids WHERE identity = ?').get(identity);
      if (row) { accountId = row.account_id; break; }
    }
    if (!accountId) { accountId = newId(); insAcc.run(accountId); }

    for (const identity of ids) insLink.run(accountId, identity);

    const ocrText       = extractedData?.rawText || null;
    const extractedJson = extractedData ? JSON.stringify(extractedData) : null;

    for (const identity of ids) {
      insert.run(
        newId(), identity,
        proof ? 1 : 0,
        (note || '').trim().slice(0, 200),
        proofImage || null,
        ocrText,
        extractedJson,
        ts
      );
    }

    res.json({ ok: true, db: loadDb() });
  } catch (err) {
    console.error('report error', err);
    res.status(500).json({ ok: false, error: 'Server error. Try again.' });
  }
});

// ── Accounts list ──────────────────────────────────────────────────────────
app.get('/api/accounts', (_req, res) => {
  res.json({ ok: true, accounts: loadDb().accounts });
});

// ── Verify a seller ────────────────────────────────────────────────────────
// POST /api/sellers/verify
// Body: { name, ig, upi, ph, ids? }
app.post('/api/sellers/verify', (req, res) => {
  try {
    const { name, ig, upi, ph } = req.body || {};
    const ids = Array.isArray(req.body?.ids) ? [...req.body.ids] : [];

    if (ig) {
      const cleanIg = String(ig).trim().replace(/^@/, '').replace(/\s/g, '').toLowerCase();
      if (cleanIg) ids.push(`ig:${cleanIg}`);
    }
    if (upi) {
      const cleanUpi = String(upi).trim().toLowerCase();
      if (/^[\w.\-]+@[a-z]{2,}$/.test(cleanUpi)) ids.push(`upi:${cleanUpi}`);
    }
    if (ph) {
      const cleanPh = String(ph).replace(/\D/g, '').slice(-10);
      if (cleanPh.length === 10) ids.push(`ph:${cleanPh}`);
    }

    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) {
      return res.status(400).json({
        ok: false,
        error: 'Provide at least one valid identity (Instagram @handle, UPI name@bank, or 10-digit phone).',
      });
    }

    const sellerName = (name || '').trim() || null;

    // Check if any provided identity is already linked to an existing account
    let accountId = null;
    for (const identity of uniqueIds) {
      const row = db.prepare('SELECT account_id FROM account_ids WHERE identity = ?').get(identity);
      if (row) { accountId = row.account_id; break; }
    }

    if (!accountId) {
      accountId = newId();
      db.prepare('INSERT INTO accounts (id, verified, name) VALUES (?, 1, ?)').run(accountId, sellerName);
    } else {
      db.prepare('UPDATE accounts SET verified = 1, name = COALESCE(?, name) WHERE id = ?')
        .run(sellerName, accountId);
    }

    const insId = db.prepare('INSERT OR IGNORE INTO account_ids (account_id, identity) VALUES (?, ?)');
    for (const identity of uniqueIds) {
      insId.run(accountId, identity);
    }

    console.log(`✓ Verified seller "${sellerName || uniqueIds[0]}" with IDs: ${uniqueIds.join(', ')}`);
    res.json({ ok: true, accountId, db: loadDb() });
  } catch (err) {
    console.error('verify seller error', err);
    res.status(500).json({ ok: false, error: 'Failed to verify seller.' });
  }
});

// ── Serve frontend build (if present) ─────────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// ─── Start / Export ──────────────────────────────────────────────────────────
seedIfEmpty();
if (!isVercel) {
  app.listen(PORT, () => console.log(`TraceOn API ➜ http://localhost:${PORT}`));
}

module.exports = app;
