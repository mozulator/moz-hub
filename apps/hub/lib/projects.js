const fs = require('fs');
const path = require('path');

function isIgnoredDir(name) {
  return name === 'node_modules' || name === '.git' || name === '.cursor' || name === 'dist' || name === 'build';
}

function safeJsonParse(filePath, contents) {
  try {
    return JSON.parse(contents);
  } catch (err) {
    const e = new Error(`Invalid JSON in ${filePath}: ${err.message}`);
    e.cause = err;
    throw e;
  }
}

function walkForProjectJson(rootDir) {
  const out = [];
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      if (ent.isDirectory()) {
        if (!isIgnoredDir(ent.name)) {
          stack.push(path.join(current, ent.name));
        }
        continue;
      }

      if (ent.isFile() && ent.name.toLowerCase() === 'project.json') {
        out.push(path.join(current, ent.name));
      }
    }
  }

  return out;
}

function normalizeMountPath(slugOrPath) {
  // Always mount projects under /p/<slug>
  const slug = String(slugOrPath || '').trim();
  if (!slug) return null;
  return `/p/${slug}`;
}

function validateAndNormalizeProject(manifestPath, manifestDir, raw) {
  const slug = String(raw.slug || '').trim();
  const title = String(raw.title || '').trim();
  const type = String(raw.type || '').trim();

  if (!slug) throw new Error(`Missing required field "slug" in ${manifestPath}`);
  if (!title) throw new Error(`Missing required field "title" in ${manifestPath}`);
  if (!type) throw new Error(`Missing required field "type" in ${manifestPath}`);

  const mountPath = normalizeMountPath(slug);
  const description = String(raw.description || '').trim();
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : [];
  const icon = raw.icon ? String(raw.icon) : 'fa-folder';

  if (type === 'static') {
    const staticDir = raw.staticDir ? String(raw.staticDir) : '.';
    const index = raw.index ? String(raw.index) : 'index.html';
    const absStaticDir = path.resolve(manifestDir, staticDir);
    return {
      slug,
      title,
      description,
      tags,
      icon,
      type,
      mountPath,
      href: `${mountPath}/`,
      static: {
        dirAbs: absStaticDir,
        index
      }
    };
  }

  if (type === 'redirect') {
    const url = String(raw.url || '').trim();
    if (!url) throw new Error(`Missing required field "url" for redirect project in ${manifestPath}`);
    return {
      slug,
      title,
      description,
      tags,
      icon,
      type,
      mountPath,
      href: url,
      redirect: { url }
    };
  }

  if (type === 'express') {
    const modulePath = String(raw.module || '').trim();
    if (!modulePath) throw new Error(`Missing required field "module" for express project in ${manifestPath}`);
    const absModule = path.resolve(manifestDir, modulePath);
    return {
      slug,
      title,
      description,
      tags,
      icon,
      type,
      mountPath,
      href: `${mountPath}/`,
      express: {
        moduleAbs: absModule
      }
    };
  }

  throw new Error(`Unsupported project type "${type}" in ${manifestPath}`);
}

function loadProjectsFromProjectsDir(projectsDir) {
  const manifests = walkForProjectJson(projectsDir);

  const projects = manifests
    .map((manifestPath) => {
      const manifestDir = path.dirname(manifestPath);
      const raw = safeJsonParse(manifestPath, fs.readFileSync(manifestPath, 'utf8'));
      return validateAndNormalizeProject(manifestPath, manifestDir, raw);
    })
    // Stable order: slug asc
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return projects;
}

function mountProjects(app, projects, { repoRoot }) {
  // Note: mount order matters; we keep mounts specific and under /p/* to avoid collisions.
  for (const p of projects) {
    if (p.type === 'static') {
      app.use(
        p.mountPath,
        expressStaticWithIndex(p.static.dirAbs, p.static.index)
      );
      continue;
    }

    if (p.type === 'redirect') {
      // Redirect the mountPath and anything under it to the external URL
      app.use(p.mountPath, (req, res) => {
        res.redirect(p.redirect.url);
      });
      continue;
    }

    if (p.type === 'express') {
      // Load module dynamically at startup.
      // Module must export: createApp({ basePath, repoRoot }) => expressApp
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(p.express.moduleAbs);
      if (!mod || typeof mod.createApp !== 'function') {
        throw new Error(`Express project module must export createApp(): ${p.express.moduleAbs}`);
      }
      const subApp = mod.createApp({ basePath: p.mountPath, repoRoot });
      app.use(p.mountPath, subApp);
      continue;
    }
  }
}

function expressStaticWithIndex(dirAbs, indexFile) {
  // Lazy require to keep this module usable in non-express contexts/tests.
  // eslint-disable-next-line global-require
  const express = require('express');
  return express.static(dirAbs, {
    index: [indexFile]
  });
}

module.exports = {
  loadProjectsFromProjectsDir,
  mountProjects
};


