const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
const okUrl = u => { try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } };
const rot = id => ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 5) - 2;
const who = () => localStorage.getItem('who') || '';
const today = () => new Date().toISOString().slice(0, 10);
let S = { cafes: [], visits: [], media: [] }, ready = false;
const vis = id => S.visits.filter(v => v.cafe_id === id).sort((a, b) => b.visit_date.localeCompare(a.visit_date));
const meds = id => S.media.filter(m => m.visit_id === id);
const find = (a, id) => a.find(x => x.id === id);
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 3500); }

const CAFE_F = [['name', 'Café name'], ['location', 'Location'], ['maps_url', 'Google Maps link', 'url'], ['image_url', 'Photo link (optional)', 'url'], ['reason', 'Why do we want to go?', 'textarea'], ['planned_date', 'Planned date', 'date'], ['status', 'Status', 'select', ['want', 'visited']], ['added_by', 'Added by']];
const VISIT_F = [['visit_date', 'Visit date', 'date'], ['author', 'Who is writing?'], ['ordered', 'What we ordered'], ['experience', 'Overall experience', 'textarea'], ['conversation', 'What we talked about', 'big'], ['funny_moments', 'Funny moments & inside jokes', 'textarea'], ['notes', 'Other notes', 'textarea'], ['keepsakes', 'Keepsakes (tickets, stickers…)']];
const MEDIA_F = [['platform', 'Platform', 'select', ['youtube', 'tiktok']], ['url', 'Link', 'url'], ['title', 'Title (optional)'], ['description', 'Description (optional)', 'textarea']];

/* ---------- Pieces ---------- */
const card = (c, full) => `<article class="card" style="--r:${rot(c.id)}deg"><i class="tape"></i><div class="polaroid">${okUrl(c.image_url) ? `<img src="${esc(c.image_url)}" alt="${esc(c.name)}" loading="lazy">` : '<div class="ph" aria-hidden="true">☕</div>'}<p class="cap">${esc(c.name)}</p></div>
<p><span class="stamp ${esc(c.status)}">${c.status === 'visited' ? 'Visited' : 'Want to go'}</span> ${c.planned_date ? `<small>📅 ${fmt(c.planned_date)}</small>` : ''}</p>
<p><small>📍 ${esc(c.location)}</small></p><p>${esc(c.reason)}</p>
<div class="row">${full ? '' : `<a class="btn alt sm" href="#/cafe/${esc(c.id)}">Open journal</a>`}${okUrl(c.maps_url) ? `<a href="${esc(c.maps_url)}" target="_blank" rel="noopener noreferrer">Google Maps</a>` : ''}</div></article>`;
const linkH = m => `<div class="keep ${esc(m.platform)}"><a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer"><b>${m.platform === 'tiktok' ? '🎵 TikTok' : '▶️ YouTube'}</b>: ${esc(m.title || m.url)}</a>${m.description ? `<br><small>${esc(m.description)}</small>` : ''} <button class="btn sm danger" data-a="delLink" data-id="${esc(m.id)}">remove</button></div>`;
const btn = (a, id, t, c = '') => `<button class="btn sm ${c}" data-a="${a}" data-id="${esc(id)}">${t}</button>`;

/* ---------- Views ---------- */
function journalView() {
  const v = S.cafes.filter(c => c.status === 'visited').length;
  const recent = [...S.visits].sort((a, b) => b.visit_date.localeCompare(a.visit_date)).slice(0, 3);
  return `<h2>Welcome back${who() ? ', ' + esc(who()) : ''}!</h2><div class="stats"><div class="paper k"><div class="big-num">${S.cafes.length}</div>cafés in the book</div><div class="paper s"><div class="big-num">${v}</div>visited</div><div class="paper p"><div class="big-num">${S.cafes.length - v}</div>still to try</div></div>
<h2>Recent memories</h2>${recent.map(v => { const c = find(S.cafes, v.cafe_id); return c ? `<div class="paper"><h3>${esc(c.name)} <small>· ${fmt(v.visit_date)}</small></h3><p>${esc(v.conversation.slice(0, 180))}${v.conversation.length > 180 ? '…' : ''}</p><a href="#/cafe/${esc(c.id)}">Read the full page</a></div>` : ''; }).join('') || '<p class="paper">No memories yet. Add a café and go have coffee!</p>'}`;
}
const listView = k => `<h2>${k === 'visited' ? 'Visited cafés' : 'Café bucket list'}</h2><p><button class="btn" data-a="addCafe">＋ Add a café</button></p><div class="paper row"><input id="q" type="search" placeholder="Search name, place, reason…" aria-label="Search"><select id="f" aria-label="Filter"><option value="all">All cafés</option><option value="want">Want to visit</option><option value="visited">Visited</option></select><select id="s" aria-label="Sort"><option value="name">Name A–Z</option><option value="new">Recently added</option><option value="visit">Latest visit</option><option value="plan">Planned date</option></select></div><div id="out" class="grid"></div>`;
function setupList(k) {
  $('#f').value = k === 'visited' ? 'visited' : 'want';
  const run = () => {
    const q = $('#q').value.toLowerCase(), f = $('#f').value, s = $('#s').value;
    const by = { name: (a, b) => a.name.localeCompare(b.name), new: (a, b) => b.created_at.localeCompare(a.created_at), visit: (a, b) => (vis(b.id)[0]?.visit_date || '').localeCompare(vis(a.id)[0]?.visit_date || ''), plan: (a, b) => (a.planned_date || '9').localeCompare(b.planned_date || '9') };
    $('#out').innerHTML = S.cafes.filter(c => (f === 'all' || c.status === f) && [c.name, c.location, c.reason].join(' ').toLowerCase().includes(q)).sort(by[s]).map(c => card(c)).join('') || '<p class="paper">Nothing here yet. Try a different search or add a café.</p>';
  };
  ['#q', '#f', '#s'].forEach(x => $(x).addEventListener('input', run)); run();
}
function cafeView(id) {
  const c = find(S.cafes, id);
  if (!c) return '<h2>Page not found</h2><a href="#/bucket">Back to the bucket list</a>';
  return `<a href="#/bucket">← all cafés</a><div class="grid" style="grid-template-columns:minmax(260px,420px)">${card(c, 1)}</div>
<div class="row">${btn('addVisit', id, '＋ Add a visit')}${btn('editCafe', id, 'Edit café', 'alt')}${c.status === 'want' ? btn('visitedCafe', id, 'Mark visited', 'alt') : ''}${btn('delCafe', id, 'Delete', 'danger')}</div>
<h2>Visits</h2>${vis(id).map((v, i) => `<section class="paper ${i % 2 ? 'p' : 's'}"><h3>${fmt(v.visit_date)} <small>· ${esc(v.author)}</small></h3>
<p><b>Ordered:</b> ${esc(v.ordered) || '—'}</p><p><b>Overall:</b> ${esc(v.experience)}</p><h3>What we talked about</h3><p style="white-space:pre-wrap">${esc(v.conversation)}</p>
${v.funny_moments ? `<h3>Funny moments</h3><p style="white-space:pre-wrap">${esc(v.funny_moments)}</p>` : ''}${v.notes ? `<h3>Notes</h3><p style="white-space:pre-wrap">${esc(v.notes)}</p>` : ''}${v.keepsakes ? `<p>🎟️ Keepsakes: ${esc(v.keepsakes)}</p>` : ''}
${meds(v.id).map(linkH).join('')}<div class="row">${btn('addLink', v.id, '＋ Add link')}${btn('editVisit', v.id, 'Edit visit', 'alt')}${btn('delVisit', v.id, 'Delete visit', 'danger')}</div></section>`).join('') || '<p class="paper">No visits yet. Add the first one!</p>'}`;
}
const memView = () => `<h2>Our memories</h2><div class="paper"><input id="q" type="search" placeholder="Search conversations, jokes, food…" aria-label="Search memories"></div><div id="out"></div>`;
function setupMem() {
  const run = () => {
    const q = $('#q').value.toLowerCase();
    $('#out').innerHTML = S.visits.map(v => ({ v, c: find(S.cafes, v.cafe_id) })).filter(x => x.c && JSON.stringify([x.c.name, x.v]).toLowerCase().includes(q)).sort((a, b) => b.v.visit_date.localeCompare(a.v.visit_date))
      .map(({ v, c }) => `<div class="paper"><h3>${esc(c.name)} <small>· ${fmt(v.visit_date)}</small></h3><p style="white-space:pre-wrap">${esc(v.conversation)}</p>${v.funny_moments ? `<p><i>${esc(v.funny_moments)}</i></p>` : ''}<a href="#/cafe/${esc(c.id)}">Open page</a></div>`).join('') || '<p class="paper">No matching memories.</p>';
  };
  $('#q').addEventListener('input', run); run();
}

/* ---------- Forms & actions ---------- */
function form(title, fields, init, submit) {
  const d = document.createElement('dialog'); d.className = 'paper';
  d.innerHTML = `<h3>${esc(title)}</h3><form novalidate>${fields.map(([k, l, t, o]) => `<label for="f_${k}">${l}</label>` + (t === 'textarea' || t === 'big' ? `<textarea id="f_${k}" class="${t === 'big' ? 'big' : ''}">${esc(init[k] || '')}</textarea>` : t === 'select' ? `<select id="f_${k}">${o.map(x => `<option${init[k] === x ? ' selected' : ''}>${x}</option>`).join('')}</select>` : `<input id="f_${k}" type="${t || 'text'}" value="${esc(init[k] || '')}">`)).join('')}
<p class="err" id="fe" role="alert"></p><div class="row"><button class="btn" id="fs">Save</button><button type="button" class="btn alt" id="fc">Cancel</button></div></form>`;
  d.querySelector('form').onsubmit = async e => {
    e.preventDefault(); const data = {}; fields.forEach(([k]) => data[k] = d.querySelector('#f_' + k).value.trim());
    const b = d.querySelector('#fs'); b.disabled = true; const er = await submit(data); b.disabled = false;
    if (er) d.querySelector('#fe').textContent = er; else { d.close(); toast('Saved ✓'); }
  };
  d.querySelector('#fc').onclick = () => d.close(); d.onclose = () => d.remove();
  document.body.append(d); d.showModal();
}
async function act(fn) { // returns null on success, or an error message
  try { await fn(); S = await API.list(); route(); return null; }
  catch (x) {
    if (x.code === 'conflict') { try { S = await API.list(); route(); } catch {} return 'Someone just changed this. The latest version is loaded. Please try again.'; }
    if (x.code === 'wrong_pin' || x.code === 'locked') { sessionStorage.removeItem('pin'); ready = false; document.querySelectorAll('dialog').forEach(d => d.close()); pinScreen(x.message); }
    return x.message === 'Failed to fetch' ? 'No connection to the server. Check your internet.' : x.message;
  }
}
const upd = (type, r, d) => act(() => API.update(type, { ...d, id: r.id, expected_updated_at: r.updated_at }));
const del = async (type, r, ask, id) => { if (!confirm(ask)) return; const er = await act(() => API.del(type, { id: r.id, expected_updated_at: r.updated_at })); if (er) toast(er); else { toast('Deleted'); if (id) location.hash = '#/bucket'; } };
const H = {
  addCafe: () => form('Add a café', CAFE_F, { status: 'want', added_by: who() }, d => act(() => API.add('cafe', d))),
  editCafe: id => { const c = find(S.cafes, id); form('Edit café', CAFE_F, c, d => upd('cafe', c, d)); },
  visitedCafe: async id => { const er = await upd('cafe', find(S.cafes, id), { status: 'visited' }); toast(er || 'Marked as visited ✓'); },
  delCafe: id => del('cafe', find(S.cafes, id), 'Delete this café and all its visits?', 1),
  addVisit: id => form('New visit', VISIT_F, { visit_date: today(), author: who() }, d => act(() => API.add('visit', { ...d, cafe_id: id }))),
  editVisit: id => { const v = find(S.visits, id); form('Edit visit', VISIT_F, v, d => upd('visit', v, d)); },
  delVisit: id => del('visit', find(S.visits, id), 'Delete this visit and its links?'),
  addLink: id => form('Add a link', MEDIA_F, { platform: 'youtube' }, d => act(() => API.add('media', { ...d, visit_id: id }))),
  delLink: id => del('media', find(S.media, id), 'Remove this link?')
};
app.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) H[b.dataset.a](b.dataset.id); });

/* ---------- Routing, PIN, startup ---------- */
function route() {
  if (!ready) return;
  const [k, id] = (location.hash.replace('#/', '') || 'journal').split('/');
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.hash === '#/' + k));
  if (k === 'bucket' || k === 'visited') { app.innerHTML = listView(k); setupList(k); }
  else if (k === 'cafe') app.innerHTML = cafeView(id);
  else if (k === 'memories') { app.innerHTML = memView(); setupMem(); }
  else app.innerHTML = journalView();
}
function pinScreen(msg = '') {
  $('#nav').hidden = true;
  app.innerHTML = `<section class="cover"><h1>Our Little Café Scrapbook</h1><form id="pf"><label for="nm">Your name</label><input id="nm" value="${esc(who())}" maxlength="40" autocomplete="off"><label for="pn">PIN</label><input id="pn" type="password" inputmode="numeric" maxlength="4" autocomplete="off"><p class="err" id="pe" role="alert">${esc(msg)}</p><button class="btn">Open Our Journal</button></form></section>`;
  $('#pf').onsubmit = async e => {
    e.preventDefault(); localStorage.setItem('who', $('#nm').value.trim()); sessionStorage.setItem('pin', $('#pn').value);
    try { await API.call('ping'); await boot(); } catch (x) { sessionStorage.removeItem('pin'); $('#pe').textContent = x.message === 'Failed to fetch' ? 'Cannot reach the server. Check the API_URL in config.js.' : x.message; }
  };
}
async function boot() {
  if (!CONFIG.API_URL || CONFIG.API_URL.startsWith('PASTE')) { app.innerHTML = '<p class="paper err">Set API_URL in config.js first (Stage 6).</p>'; return; }
  if (!API.pin()) return pinScreen();
  try { S = await API.list(); }
  catch (x) { if (x.code === 'wrong_pin' || x.code === 'locked') { sessionStorage.removeItem('pin'); return pinScreen(x.message); } app.innerHTML = `<p class="paper err">${esc(x.message)}. Reload the page to try again.</p>`; return; }
  ready = true; $('#nav').hidden = false; route();
}
$('#rf').onclick = async () => { try { S = await API.list(); route(); toast('Up to date ✓'); } catch (x) { toast(x.message); } };
addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => { if (!document.hidden && ready && !document.querySelector('dialog[open]')) API.list().then(d => { S = d; route(); }).catch(() => {}); });
boot();
