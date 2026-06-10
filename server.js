require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database(path.join(__dirname, 'crm.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    company TEXT,
    phone TEXT
  )`);
});

app.use(helmet());
app.use(cors({ origin: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function isValidEmail(email) {
  return typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

app.get('/api/contacts', (req, res) => {
  db.all('SELECT * FROM contacts ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/contacts', (req, res) => {
  const { name, email, company, phone } = req.body || {};
  if (!name && !email) return res.status(400).json({ error: 'name or email is required' });
  if (email && !isValidEmail(email)) return res.status(400).json({ error: 'invalid email' });

  db.run(
    'INSERT INTO contacts (name, email, company, phone) VALUES (?, ?, ?, ?)',
    [String(name || ''), String(email || ''), String(company || ''), String(phone || '')],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM contacts WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json(row);
      });
    }
  );
});

app.put('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, company, phone } = req.body || {};
  if (email && !isValidEmail(email)) return res.status(400).json({ error: 'invalid email' });

  db.run(
    'UPDATE contacts SET name = ?, email = ?, company = ?, phone = ? WHERE id = ?',
    [String(name || ''), String(email || ''), String(company || ''), String(phone || ''), id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM contacts WHERE id = ?', [id], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(row);
      });
    }
  );
});

app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM contacts WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedId: Number(id) });
  });
});

app.post('/api/webhook', (req, res) => {
  const secret = process.env.WEBHOOK_SECRET;
  const incomingSecret = req.get('x-webhook-secret') || (req.body && req.body.secret);
  if (secret && incomingSecret !== secret) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }

  const payload = (req.body && (req.body.contact || req.body.data)) || req.body || {};
  const name = payload.name || payload.fullName || payload.contact_name || '';
  const email = payload.email || payload.email_address || '';
  const company = payload.company || payload.org || '';
  const phone = payload.phone || payload.phone_number || payload.mobile || '';

  if (!name && !email) return res.status(400).json({ error: 'missing contact data' });
  if (email && !isValidEmail(email)) return res.status(400).json({ error: 'invalid email' });

  db.run(
    'INSERT INTO contacts (name, email, company, phone) VALUES (?, ?, ?, ?)',
    [String(name), String(email), String(company), String(phone)],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM contacts WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json(row);
      });
    }
  );
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
