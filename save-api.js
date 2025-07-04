// save-api.js (Node, NOT browser)
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Add at the top, after `const app = express();`
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});


app.post('/save', (req, res) => {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`PreVeil save server running on https://localhost:${PORT}`));
