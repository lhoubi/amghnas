import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Serve static assets and HTML files with extensions enabled
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
  index: 'index.html'
}));

// Fallback handling for missing pages
app.use((req, res) => {
  if (req.path.startsWith('/ar')) {
    res.status(404).sendFile(path.join(__dirname, 'ar', 'index.html'));
  } else if (req.path.startsWith('/fr')) {
    res.status(404).sendFile(path.join(__dirname, 'fr', 'index.html'));
  } else {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, HOST, () => {
  console.log(`amghnas server running on http://${HOST}:${PORT}`);
});
