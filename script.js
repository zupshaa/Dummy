/* Data layer: swap loadData() for a database call later; the UI only needs {cafes:[...]}. */
const DATA_URL='data/cafes.json';
async function loadData(){const r=await fetch(DATA_URL,{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}

const $=s=>document.querySelector(s),app=$('#app');let DB={cafes:[]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=d=>d?new Date(d+'T00:00').toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'';
const okUrl=u=>{try{return/^https?:$/.test(new URL(u).protocol)}catch{return false}};
const hostOk=(p,u)=>{try{const h=new URL(u).hostname.replace(/^(www|m)\./,'');return p==='youtube'?/(^|\.)(youtube\.com|youtu\.be)$/.test(h):p==='tiktok'?/(^|\.)tiktok\.com$/.test(h):false}catch{return false}};
const rot=id=>([...id].reduce((a,c)=>a+c.charCodeAt(0),0)%5)-2;
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function validate(d){const e=[];if(!d||!Array.isArray(d.cafes))return['Missing a "cafes" array.'];const ids=new Set();
d.cafes.forEach((c,i)=>{const w=`Café #${i+1} (${c.id||'no id'})`;if(!c.id)e.push(w+': missing id');else if(ids.has(c.id))e.push(w+': DUPLICATE id');ids.add(c.id);
if(!c.name)e.push(w+': missing name');if(!['want','visited'].includes(c.status))e.push(w+': status must be "want" or "visited"');
if(c.mapsUrl&&!okUrl(c.mapsUrl))e.push(w+': bad mapsUrl');
(c.visits||[]).forEach((v,j)=>{const x=`${w} visit ${j+1}`;if(!v.date)e.push(x+': missing date');(v.links||[]).forEach(l=>{if(!hostOk(l.platform,l.url))e.push(`${x}: link doesn't match platform "${l.platform}": ${l.url}`)})})});return e}

const visitsOf=c=>[...(c.visits||[])].sort((a,b)=>b.date.localeCompare(a.date));
const lastVisit=c=>visitsOf(c)[0]?.date||'';
const link=l=>`<a class="keep ${esc(l.platform)}" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"><b>${l.platform==='tiktok'?'🎵 TikTok':'▶️ YouTube'}</b>: ${esc(l.title||l.url)}${l.description?`<br><small>${esc(l.description)}</small>`:''}</a>`;
const card=c=>`<article class="card" style="--r:${rot(c.id)}deg"><i class="tape"></i><div class="polaroid">${c.image&&okUrl(c.image)?`<img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy">`:'<div class="ph" aria-hidden="true">☕</div>'}<p class="cap">${esc(c.name)}</p></div>
<p><span class="stamp ${c.status}">${c.status==='visited'?'Visited':'Want to go'}</span> ${c.plannedDate?`<small>📅 ${fmt(c.plannedDate)}</small>`:''}</p>
<p><small>📍 ${esc(c.location)}</small></p><p>${esc(c.reason)}</p>
<div class="row"><a class="btn alt" href="#/cafe/${esc(c.id)}">Open journal</a>${c.mapsUrl?`<a href="${esc(c.mapsUrl)}" target="_blank" rel="noopener noreferrer">Google Maps</a>`:''}</div></article>`;

const views={
cover:()=>`<section class="cover"><h1>Our Little Café Scrapbook</h1><p class="hand" style="font-size:1.7rem">two friends · one list · many coffees</p><a class="btn" href="#/journal">Open Our Journal</a></section>`,
journal(){const v=DB.cafes.filter(c=>c.status==='visited').length,all=DB.cafes.flatMap(c=>visitsOf(c).map(x=>({c,x}))).sort((a,b)=>b.x.date.localeCompare(a.x.date)).slice(0,3);
return`<h2>Welcome back!</h2><div class="stats"><div class="paper k"><div class="big-num">${DB.cafes.length}</div>cafés in the book</div><div class="paper s"><div class="big-num">${v}</div>visited</div><div class="paper p"><div class="big-num">${DB.cafes.length-v}</div>still to try</div></div>
<h2>Recent memories</h2>${all.map(({c,x})=>`<div class="paper"><h3>${esc(c.name)} <small>· ${fmt(x.date)}</small></h3><p>${esc(x.conversation.slice(0,180))}${x.conversation.length>180?'…':''}</p><a href="#/cafe/${esc(c.id)}">Read the full page</a></div>`).join('')||'<p>No memories yet. Go have coffee!</p>'}`},
list(mode){return`<h2>${mode==='visited'?'Visited cafés':'Café bucket list'}</h2><div class="paper row"><input id="q" type="search" placeholder="Search name, place, reason…" aria-label="Search"><select id="f" aria-label="Filter"><option value="all">All cafés</option><option value="want">Want to visit</option><option value="visited">Visited</option></select><select id="s" aria-label="Sort"><option value="name">Name A–Z</option><option value="new">Recently added</option><option value="visit">Latest visit</option><option value="plan">Planned date</option></select></div><div id="out" class="grid"></div>`},
cafe(id){const c=DB.cafes.find(x=>x.id===id);if(!c)return'<h2>Page not found</h2><a href="#/bucket">Back to the bucket list</a>';
return`<a href="#/bucket">← all cafés</a><div class="paper k"><i class="tape"></i><div class="row"><div style="flex:1 1 260px">${card({...c,reason:c.reason})}</div></div></div>
<h2>Visits</h2>${visitsOf(c).map(v=>`<section class="paper ${c.visits.indexOf(v)%2?'p':'s'}"><h3>${fmt(v.date)} <small>· by ${esc(v.author||'us')}</small></h3>
<p><b>Ordered:</b> ${(v.ordered||[]).map(esc).join(', ')||'—'}</p><p><b>Overall:</b> ${esc(v.experience)}</p>
<h3>What we talked about</h3><p style="white-space:pre-wrap">${esc(v.conversation)}</p>${v.funny?`<h3>Funny moments</h3><p>${esc(v.funny)}</p>`:''}${v.notes?`<h3>Notes</h3><p>${esc(v.notes)}</p>`:''}
${(v.keepsakes||[]).length?`<p>🎟️ Keepsakes: ${v.keepsakes.map(esc).join(' · ')}</p>`:''}${(v.links||[]).map(link).join('')}</section>`).join('')||'<p class="paper">No visits yet. Plan one!</p>'}
<a class="btn" href="#/contribute?cafe=${esc(c.id)}">Add a memory</a>`},
memories(){return`<h2>Our memories</h2><div class="paper"><input id="q" type="search" placeholder="Search conversations, jokes, food…" aria-label="Search memories"></div><div id="out"></div>`},
contribute(){const pre=(location.hash.split('cafe=')[1]||'');return`<h2>Contribute to our scrapbook</h2>
<div class="paper p"><b>Heads up:</b> this form does <u>not</u> save or send anything. It writes a draft you copy and send to the owner in any chat app. The owner reviews it and adds it to the shared list on GitHub.</div>
<form id="cf" novalidate class="paper">
<label for="t">What are you sharing?</label><select id="t"><option value="new">Suggest a new café</option><option value="visit">Add a visit / memory</option><option value="fix">Suggest a correction</option><option value="visited">Mark a café as visited</option></select>
<label for="by">Your name</label><input id="by" required>
<div id="ex"><label for="ca">Existing café</label><select id="ca"><option value="">— choose —</option>${DB.cafes.map(c=>`<option value="${esc(c.id)}"${c.id===pre?' selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
<div id="nw"><label for="nm">Café name</label><input id="nm"><label for="lo">Location</label><input id="lo"><label for="mp">Google Maps link</label><input id="mp" type="url"><label for="re">Why do we want to go?</label><textarea id="re"></textarea></div>
<div id="vs"><label for="dt">Visit date</label><input id="dt" type="date"><label for="or">Food &amp; drinks (comma separated)</label><input id="or"><label for="cv">What we talked about</label><textarea id="cv" class="big"></textarea><label for="fn">Funny moments</label><textarea id="fn"></textarea>
<label>YouTube / TikTok links (optional)</label>${[1,2].map(i=>`<div class="row"><select id="lp${i}"><option value="youtube">YouTube</option><option value="tiktok">TikTok</option></select><input id="lu${i}" type="url" placeholder="https://…"><input id="lt${i}" placeholder="Title (optional)"></div>`).join('')}</div>
<div id="fx"><label for="fxt">Correction</label><textarea id="fxt"></textarea></div>
<p id="er" class="err" role="alert"></p><button class="btn" type="submit">Make my draft</button></form>
<div id="res" class="paper k" hidden><h3>Your draft</h3><pre id="txt"></pre><div class="row"><button class="btn" id="cp">Copy contribution</button><button class="btn alt" id="sh">Share contribution</button></div><p id="msg" aria-live="polite"></p><small>If sharing isn't supported, copy the text and paste it in any chat.</small></div>`},
owner(){return`<h2>Owner tools</h2><p>Paste your edited <code>data/cafes.json</code> here to check it <i>before</i> committing.</p><textarea id="ov" class="big" aria-label="JSON"></textarea><p><button class="btn" id="ob">Validate</button></p><pre id="oo">Waiting…</pre>`}};

function filterList(mode){const q=$('#q').value.toLowerCase(),f=$('#f').value,s=$('#s').value;
let a=DB.cafes.filter(c=>(f==='all'||c.status===f)&&JSON.stringify([c.name,c.location,c.reason]).toLowerCase().includes(q));
const by={name:(x,y)=>x.name.localeCompare(y.name),new:(x,y)=>y.createdAt.localeCompare(x.createdAt),visit:(x,y)=>lastVisit(y).localeCompare(lastVisit(x)),plan:(x,y)=>(x.plannedDate||'9').localeCompare(y.plannedDate||'9')};
$('#out').innerHTML=a.sort(by[s]).map(card).join('')||'<p class="paper">Nothing matches. Try a different search.</p>'}
function setupList(mode){$('#f').value=mode==='visited'?'visited':'want';['#q','#f','#s'].forEach(x=>$(x).addEventListener('input',()=>filterList(mode)));filterList(mode)}
function setupMemories(){const run=()=>{const q=$('#q').value.toLowerCase();$('#out').innerHTML=DB.cafes.flatMap(c=>(c.visits||[]).map(v=>({c,v}))).filter(({c,v})=>JSON.stringify([c.name,v]).toLowerCase().includes(q)).sort((a,b)=>b.v.date.localeCompare(a.v.date)).map(({c,v})=>`<div class="paper"><h3>${esc(c.name)} <small>· ${fmt(v.date)}</small></h3><p>${esc(v.conversation)}</p>${v.funny?`<p><i>${esc(v.funny)}</i></p>`:''}<a href="#/cafe/${esc(c.id)}">Open page</a></div>`).join('')||'<p>No matching memories.</p>'};$('#q').addEventListener('input',run);run()}

function setupForm(){const t=$('#t'),show=()=>{const v=t.value;$('#ex').hidden=v==='new';$('#nw').hidden=v!=='new';$('#vs').hidden=!(v==='new'||v==='visit');$('#fx').hidden=v!=='fix'};t.onchange=show;show();
$('#cf').onsubmit=e=>{e.preventDefault();const g=i=>$(i).value.trim(),v=t.value,err=[];
if(!g('#by'))err.push('Add your name.');if(v!=='new'&&!g('#ca'))err.push('Choose a café.');if(v==='new'&&!g('#nm'))err.push('Add the café name.');
if(g('#mp')&&!okUrl(g('#mp')))err.push('Maps link must start with https://');if(v==='fix'&&!g('#fxt'))err.push('Describe the correction.');
const wantsVisit=v==='visit'||v==='visited'||(v==='new'&&(g('#dt')||g('#cv')));if((v==='visit'||v==='visited')&&!g('#dt'))err.push('Add the visit date.');if(v==='visit'&&!g('#cv'))err.push('Add what you talked about.');
const links=[1,2].map(i=>({platform:g('#lp'+i),url:g('#lu'+i),title:g('#lt'+i)})).filter(l=>l.url);links.forEach(l=>{if(!okUrl(l.url)||!hostOk(l.platform,l.url))err.push(`That link isn't a valid ${l.platform} URL: ${l.url}`)});
$('#er').textContent=err.join(' ');if(err.length)return;
const visit=wantsVisit&&g('#dt')?{date:g('#dt'),author:g('#by'),ordered:g('#or').split(',').map(s=>s.trim()).filter(Boolean),conversation:g('#cv'),funny:g('#fn'),links}:null;
const p={type:v,from:g('#by'),cafeId:v==='new'?slug(g('#nm')):g('#ca')};if(v==='new')Object.assign(p,{name:g('#nm'),location:g('#lo'),mapsUrl:g('#mp'),reason:g('#re'),status:'want'});if(v==='fix')p.correction=g('#fxt');if(v==='visited')p.markVisited=true;if(visit)p.visit=visit;
const label={new:'NEW CAFÉ',visit:'NEW VISIT',fix:'CORRECTION',visited:'MARK VISITED'}[v];
$('#txt').textContent=`☕ Café Scrapbook contribution (${label}) from ${p.from}\nReview, then merge into data/cafes.json.\n\n${JSON.stringify(p,null,2)}`;$('#res').hidden=false;$('#res').scrollIntoView({behavior:'smooth'})};
$('#cp').onclick=async()=>{try{await navigator.clipboard.writeText($('#txt').textContent);$('#msg').textContent='Copied! Now paste it into your chat.'}catch{const r=document.createRange();r.selectNodeContents($('#txt'));getSelection().removeAllRanges();getSelection().addRange(r);$('#msg').textContent='Text selected. Press Ctrl/Cmd+C to copy.'}};
$('#sh').onclick=async()=>{if(navigator.share){try{await navigator.share({title:'Café Scrapbook contribution',text:$('#txt').textContent})}catch{}}else $('#msg').textContent='Sharing isn’t supported here. Use Copy and paste it in any chat.'}}

function setupOwner(){$('#ob').onclick=()=>{try{const e=validate(JSON.parse($('#ov').value));$('#oo').textContent=e.length?'Problems:\n- '+e.join('\n- '):'✅ JSON is valid. No duplicate IDs. Safe to commit.'}catch(x){$('#oo').textContent='❌ Not valid JSON: '+x.message}}}

function route(){const [path,...rest]=(location.hash.replace('#/','')||'cover').split('?')[0].split('/');const k=path||'cover';
$('#nav').hidden=k==='cover';document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.hash==='#/'+k));
if(k==='bucket'||k==='visited'){app.innerHTML=views.list(k);setupList(k)}
else if(k==='cafe')app.innerHTML=views.cafe(rest[0]);
else if(views[k]&&k!=='list'){app.innerHTML=views[k]();if(k==='memories')setupMemories();if(k==='contribute')setupForm();if(k==='owner')setupOwner()}
else app.innerHTML=views.cover();window.scrollTo(0,0)}

(async()=>{try{DB=await loadData();const e=validate(DB);if(e.length){const b=$('#banner');b.hidden=false;b.textContent='Data problems: '+e.join(' | ')}}
catch(x){const b=$('#banner');b.hidden=false;b.textContent='Couldn’t load data/cafes.json ('+x.message+'). On your computer, open via GitHub Pages or a local server, not by double-clicking the file.'}
addEventListener('hashchange',route);route()})();
