const btn = document.getElementById('btn');
const out = document.getElementById('out');

btn?.addEventListener('click', async () => {
  out.textContent = 'Loading…';
  try {
    const res = await fetch('./api/health', { headers: { Accept: 'application/json' } });
    const json = await res.json();
    out.textContent = JSON.stringify(json, null, 2);
  } catch (e) {
    out.textContent = String(e?.message || e);
  }
});


