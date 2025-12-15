require('dotenv').config();
const path = require('path');
const { createApp } = require('./hub-app');

const PORT = process.env.PORT || 3000;

// Standalone runner for local-only use (Hub mounts use `hub-app.js` directly).
const app = createApp({
  basePath: '',
  repoRoot: path.resolve(__dirname, '..', '..')
});
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Budget Tracker running at http://localhost:${PORT}`);
});
