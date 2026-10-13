/* The only file that talks to the backend. Swap this to change the database later. */
const API = {
  pin: () => sessionStorage.getItem('pin') || '',
  async call(action, type, data) {
    // text/plain avoids a CORS preflight, which Apps Script does not support
    const r = await fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ pin: API.pin(), action, type, data }) });
    const j = await r.json();
    if (!j.ok) { const e = new Error(j.message || j.error); e.code = j.error; throw e; }
    return j.data;
  },
  list: () => API.call('list'),
  add: (t, d) => API.call('add', t, d),
  update: (t, d) => API.call('update', t, d),
  del: (t, d) => API.call('delete', t, d)
};
