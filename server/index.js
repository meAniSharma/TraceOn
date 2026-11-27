/**
 * TraceOn Backend Server
 * Express + SQLite (with fallback) + JWT auth + OCR
 *
 * Runs locally (http://localhost:3001) or on Vercel Serverless Function (/api/*).
 */

'use strict';

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createWorker } = require('tesseract.js');

const isVercel = Boolean(process.env.VERCEL);
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'traceon-dev-secret-change-in-prod';
const DB_PATH = isVercel ? path.join('/tmp', 'traceon.db') : path.join(__dirname, 'traceon.db');
const UPLOADS_DIR = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');

// Ensure uploads directory exists
try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch { /* ignore in read-only environment */ }

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

// ─── In-memory database fallback (for Vercel Node < 22 or read-only /tmp) ─────
function createInMemoryDb() {
  const store = { users: [], accounts: [], account_ids: [], reports: [] };
  return {
    exec() {},
    prepare(sql) {
      const s = sql.trim();
      return {
        get(...params) {
          if (s.includes('FROM accounts') && s.includes('COUNT(*)')) {
            return { c: store.accounts.length };
          }
          if (s.includes('FROM users WHERE email = ?')) {
            const e = String(params[0] || '').toLowerCase();
            return store.users.find((u) => u.email === e) || null;
          }
          if (s.includes('FROM account_ids WHERE identity = ?')) {
            const id = params[0];
            return store.account_ids.find((a) => a.identity === id) || null;
          }
          return null;
        },
        all() {
          if (s.includes('FROM accounts')) return [...store.accounts];
          if (s.includes('FROM account_ids')) return [...store.account_ids];
          if (s.includes('FROM reports')) return [...store.reports].sort((a, b) => b.ts - a.ts);
          return [];
        },
        run(...params) {
          if (s.startsWith('INSERT INTO accounts')) {
            const [id, verified, name] = params;
            store.accounts.push({ id, verified: verified ? 1 : 0, name: name || null });
          } else if (s.includes('UPDATE accounts SET verified = 1')) {
            const [name, id] = params;
            const acc = store.accounts.find((a) => a.id === id);
            if (acc) {
              acc.verified = 1;
              if (name) acc.name = name;
            }
          } else if (s.includes('INSERT INTO account_ids') || s.includes('INSERT OR IGNORE INTO account_ids')) {
            const [account_id, identity] = params;
            if (!store.account_ids.some((a) => a.account_id === account_id && a.identity === identity)) {
              store.account_ids.push({ account_id, identity });
            }
          } else if (s.startsWith('INSERT INTO reports')) {
            const [id, identity, proof, note, proof_image, ocr_text, extracted_data, ts] = params;
            store.reports.push({
              id,
              identity,
              proof: proof ? 1 : 0,
              note,
              proof_image: proof_image || null,
              ocr_text: ocr_text || null,
              extracted_data: extracted_data || null,
              ts: ts || Date.now(),
            });
          } else if (s.startsWith('INSERT INTO users')) {
            const [id, name, email, hash, created_at] = params;
            store.users.push({ id, name, email, hash, created_at });
          }
          return { changes: 1 };
        },
      };
    },
  };
}

// ─── Database setup ───────────────────────────────────────────────────────────
let db;
try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_PATH);
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
  try {
    db.exec(`ALTER TABLE reports ADD COLUMN proof_image TEXT`);
    db.exec(`ALTER TABLE reports ADD COLUMN ocr_text TEXT`);
    db.exec(`ALTER TABLE reports ADD COLUMN extracted_data TEXT`);
  } catch { /* already exist */ }
} catch (e) {
  console.log('node:sqlite unavailable or storage read-only; using resilient in-memory database fallback.');
  db = createInMemoryDb();
}

// ─── Seed demo data if empty ──────────────────────────────────────────────────
function seedIfEmpty() {
  try {
    const count = db.prepare('SELECT COUNT(*) AS c FROM accounts').get();
    if (count && count.c > 0) return;

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
  } catch (err) {
    console.error('seed error', err);
  }
}

// ─── OCR helpers ──────────────────────────────────────────────────────────────
function extractEntities(text) {
  const upiIds    = [...new Set(text.match(/[\w.\-]+@[a-z]{2,}/gi) || [])].map((s) => s.toLowerCase());
  const phones    = [...new Set((text.match(/(?<!\d)(\+91[-\s]?)?[6-9]\d{9}(?!\d)/g) || [])
                      .map((s) => s.replace(/\D/g, '').slice(-10)))];
  const amounts   = [...new Set(text.match(/(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d{1,2})?/gi) || [])];
  const igHandles = [...new Set((text.match(/@[a-zA-Z0-9_.]{3,30}/g) || []).map((s) => s.toLowerCase()))];

  return { upiIds, phones, amounts, igHandles, rawText: text.trim() };
}

async function runOcr(filePath) {
  const worker = await createWorker('eng', 1, {
    logger: () => {},
    errorHandler: () => {},
  });
  try {
    const { data: { text } } = await worker.recognize(filePath);
    return extractEntities(text);
  } finally {
    await worker.terminate();
  }
}

function newId() { return crypto.randomUUID(); }

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

// ─── Router (mounted at both /api and / for Vercel rewrite compatibility) ──────
const api = express.Router();

api.get('/health', (_req, res) => res.json({ ok: true, timestamp: Date.now() }));

api.post('/auth/signup', async (req, res) => {
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

api.post('/auth/login', async (req, res) => {
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

api.get('/db', (_req, res) => res.json(loadDb()));

api.post('/ocr', upload.single('proof'), async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: 'No image uploaded.' });
  try {
    const extracted = await runOcr(req.file.path);
    res.json({ ok: true, imageUrl: `/uploads/${req.file.filename}`, extracted });
  } catch (err) {
    console.error('OCR error', err);
    res.json({ ok: true, imageUrl: `/uploads/${req.file.filename}`, extracted: null, ocrError: 'OCR processed without extractions.' });
  }
});

api.get('/reports', (_req, res) => res.json({ ok: true, reports: loadDb().reports }));

api.post('/reports', (req, res) => {
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

api.get('/accounts', (_req, res) => res.json({ ok: true, accounts: loadDb().accounts }));

api.post('/sellers/verify', (req, res) => {
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

    console.log(`✓ Verified seller "${sellerName || uniqueIds[0]}"`);
    res.json({ ok: true, accountId, db: loadDb() });
  } catch (err) {
    console.error('verify seller error', err);
    res.status(500).json({ ok: false, error: 'Failed to verify seller.' });
  }
});

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve uploaded proof images
app.use('/uploads', express.static(UPLOADS_DIR));

// Mount routes at BOTH /api and / (for Vercel path rewrites compatibility)
app.use('/api', api);
app.use('/', api);

// Serve frontend build (when running standalone)
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
