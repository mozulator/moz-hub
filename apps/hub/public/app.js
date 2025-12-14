async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return await res.json();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return node;
}

function renderProjects(projects, query) {
  const cards = document.getElementById('cards');
  const countLabel = document.getElementById('countLabel');

  const q = (query || '').trim().toLowerCase();
  const filtered = q
    ? projects.filter((p) => {
        const hay = `${p.title} ${p.slug} ${p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      })
    : projects;

  countLabel.textContent = `${filtered.length} / ${projects.length}`;
  cards.innerHTML = '';

  if (!filtered.length) {
    cards.appendChild(
      el('div', { class: 'card' }, [
        el('div', { class: 'card-top' }, [el('div', { class: 'card-title' }, ['No matches'])]),
        el('p', { class: 'card-desc' }, ['Try a different search.'])
      ])
    );
    return;
  }

  for (const p of filtered) {
    const isExternal = p.type === 'redirect';
    const badgeText = isExternal ? 'External' : 'Hosted';

    const a = el(
      'a',
      {
        href: p.href,
        target: isExternal ? '_blank' : '_self',
        rel: isExternal ? 'noreferrer' : ''
      },
      [
        el('div', { class: 'card-top' }, [
          el('div', { class: 'card-icon' }, [el('i', { class: `fa-solid ${p.icon || 'fa-folder'}` })]),
          el('div', { class: 'badge' }, [badgeText])
        ]),
        el('h3', { class: 'card-title' }, [p.title]),
        el('p', { class: 'card-desc' }, [p.description || '—']),
        el(
          'div',
          { class: 'tag-row' },
          (p.tags || []).slice(0, 6).map((t) => el('span', { class: 'tag' }, [t]))
        )
      ]
    );

    cards.appendChild(el('div', { class: 'card' }, [a]));
  }
}

async function main() {
  const healthLabel = document.getElementById('healthLabel');
  const dot = document.querySelector('.dot');
  const searchInput = document.getElementById('searchInput');
  let projects = [];

  try {
    const [projectsRes] = await Promise.all([fetchJson('/api/projects')]);
    projects = projectsRes.projects || [];
    renderProjects(projects, '');
  } catch (e) {
    const cards = document.getElementById('cards');
    cards.innerHTML = '';
    cards.appendChild(
      el('div', { class: 'card' }, [
        el('div', { class: 'card-top' }, [el('div', { class: 'card-title' }, ['Failed to load projects'])]),
        el('p', { class: 'card-desc' }, [String(e?.message || e)])
      ])
    );
  }

  // Search
  searchInput.addEventListener('input', () => {
    renderProjects(projects, searchInput.value);
  });

  // Health (nice to have)
  try {
    await fetchJson('/api/health');
    healthLabel.textContent = 'Online';
    dot.classList.add('ok');
  } catch {
    healthLabel.textContent = 'Offline';
  }
}

document.addEventListener('DOMContentLoaded', main);


