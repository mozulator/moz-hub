const express = require('express');
const path = require('path');

function createApp({ repoRoot }) {
  const projectRoot = path.join(repoRoot, 'Projects', '__PROJECT_NAME__');
  const app = express();

  // Static files for the app UI (under src/)
  app.use('/assets', express.static(path.join(projectRoot, 'assets')));
  app.use('/src', express.static(path.join(projectRoot, 'src')));
  app.use(express.static(path.join(projectRoot, 'src')));

  // Home
  app.get('/', (req, res) => {
    res.sendFile(path.join(projectRoot, 'src', 'index.html'));
  });

  // Example API
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, app: '__PROJECT_SLUG__', ts: new Date().toISOString() });
  });

  return app;
}

module.exports = { createApp };


