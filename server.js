const path = require('path');
const express = require('express');

const { loadProjectsFromProjectsDir, mountProjects } = require('./apps/hub/lib/projects');

const app = express();

// Hub static assets (homepage, CSS, JS)
app.use(express.static(path.join(__dirname, 'apps/hub/public')));

// API: list projects (used by homepage)
app.get('/api/projects', (req, res) => {
  try {
    const projects = loadProjectsFromProjectsDir(path.join(__dirname, 'Projects'));
    res.json({
      projects: projects.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        tags: p.tags,
        icon: p.icon,
        type: p.type,
        href: p.href
      }))
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to load projects:', err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

// Mount all projects under /p/<slug> (static / redirect / express apps)
mountProjects(app, loadProjectsFromProjectsDir(path.join(__dirname, 'Projects')), {
  repoRoot: __dirname
});

// Simple health check (useful on Render)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Project hub running on http://localhost:${PORT}`);
});


