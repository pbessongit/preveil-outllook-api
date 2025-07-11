// save-api.js (Node, NOT browser)
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

const corsOptions = {
  origin: '*', // Or restrict to https://outlook.office.com for production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/save', (req, res) => {
  console.log('POST /save hit at', new Date().toISOString());
  console.log('req.body:', req.body);
  const { filename, data } = req.body;
  const filePath = path.join(__dirname, filename || `mail_${Date.now()}.html`);
  fs.writeFile(filePath, data, (err) => {
    if (err) {
      console.error("File save failed:", err);
      return res.status(500).send("Failed to save");
    }
    console.log("Saved:", filePath);
    res.send("OK");
  });
});

// ====== ENCRYPT EMAIL ENDPOINT ======

const ENCRYPTION_KEY = crypto.randomBytes(32); // 256-bit key (keep this consistent for real use!)
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

app.post('/encrypt-email', (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) {
    return res.status(400).json({ error: "Missing subject or body" });
  }
  const encryptedBody = encrypt(body);

  // Prepend lock icon if not present
  let newSubject = subject;
  if (!subject.startsWith("🔒")) {
    newSubject = "🔒 " + subject;
  }

  res.json({
    subject: newSubject,
    body: encryptedBody,
  });
});

// ====== END ENCRYPT EMAIL ENDPOINT ======

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`PreVeil save server running on https://localhost:${PORT}`));
