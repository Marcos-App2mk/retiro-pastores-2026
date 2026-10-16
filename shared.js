/* Código compartido: almacenamiento, utilidades y lista de comidas */

/* ---------- Almacenamiento ----------
   Compartido (registros, comprobantes): base de datos del artefacto, visible para todos los teléfonos.
   Personal ("mine"): este teléfono (localStorage). */
const LS = (()=>{
  try{ localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return localStorage; }
  catch(e){
    const m = {};
    return { getItem:k=>(k in m?m[k]:null), setItem:(k,v)=>{m[k]=String(v);}, removeItem:k=>{delete m[k];},
             key:i=>Object.keys(m)[i]||null, get length(){ return Object.keys(m).length; } };
  }
})();
/* La URL de la base de datos se configura en config.js */
const FIREBASE_URL = window.FIREBASE_URL || '';
const FB = (FIREBASE_URL || '').trim().replace(/\/+$/,'');
async function fb(method, path, body){
  const r = await fetch(FB + '/' + path + '.json', { method, headers:{'Content-Type':'application/json'}, body: body === undefined ? undefined : JSON.stringify(body) });
  if(!r.ok) throw new Error('fb_' + r.status);
  return r.json();
}
const API = !!window.USE_API;
let SESSION_PIN = '';
async function api(body){
  const r = await fetch('/api/db', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(Object.assign({ pin: SESSION_PIN }, body)) });
  const j = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(j.error || ('api_' + r.status));
  return j;
}
let _dbP = null;
function getDb(){
  if(!_dbP){ _dbP = (async()=>{ try{ if(window.claude && window.claude.use) return await window.claude.use('db'); }catch(e){} return null; })(); }
  return _dbP;
}
const sk = key => { const i = key.indexOf(':'); return [key.slice(0,i), key.slice(i+1)]; };
function lsKeys(pre){ const out=[]; for(let i=0;i<LS.length;i++){ const k=LS.key(i); if(k && k.startsWith(pre)) out.push(k.slice(pre.length)); } return out; }
window.storage = {
  async get(key, shared){
    if(shared && API){
      try{ const [c,id]=sk(key); const j = await api({op:'get', c, id}); return j.value ? {key, value:j.value} : null; }catch(e){}
      const v = LS.getItem('loc/'+key); return v===null ? null : {key, value:v};
    }
    if(shared && FB){
      try{ const [c,id]=sk(key); const v = await fb('GET', c+'/'+id); return (v && v.value) ? {key, value:v.value} : null; }catch(e){}
      const v = LS.getItem('loc/'+key); return v===null ? null : {key, value:v};
    }
    if(shared){
      const db = await getDb();
      if(db){ try{ const [c,id]=sk(key); const sn = await db.doc(c+'/'+id).get(); return sn.exists ? {key, value: sn.data().value} : null; }catch(e){} }
      const v = LS.getItem('loc/'+key); return v===null ? null : {key, value:v};
    }
    const v = LS.getItem('mine/'+key); return v===null ? null : {key, value:v};
  },
  async set(key, value, shared){
    if(shared && API){
      try{ const [c,id]=sk(key); const j = await api({op:'set', c, id, value, token: null}); LS.removeItem('loc/'+key); return {key, synced:true, value: j.value || value}; }
      catch(e){ try{ LS.setItem('loc/'+key, value); }catch(_){} return {key, synced:false, error:'sin_conexion'}; }
    }
    if(shared && FB){
      try{ const [c,id]=sk(key); await fb('PUT', c+'/'+id, { value }); LS.removeItem('loc/'+key); return {key, synced:true}; }
      catch(e){ try{ LS.setItem('loc/'+key, value); }catch(_){} return {key, synced:false, error:'sin_conexion'}; }
    }
    if(shared){
      const db = await getDb();
      let err = null;
      if(db){ try{ const [c,id]=sk(key); await db.doc(c+'/'+id).set({value}); LS.removeItem('loc/'+key); return {key, synced:true}; }catch(e){ err = e; } }
      try{ LS.setItem('loc/'+key, value); }catch(e){}
      return {key, synced:false, error: err ? (err.code||'error') : 'sin_base_compartida'};
    }
    try{ LS.setItem('mine/'+key, value); return {key, ok:true}; }catch(e){ return {key, ok:false}; }
  },
  async delete(key, shared){
    if(shared && API){
      LS.removeItem('loc/'+key);
      try{ const [c,id]=sk(key); await api({op:'delete', c, id}); return {synced:true}; }catch(e){ return {synced:false}; }
    }
    if(shared && FB){
      LS.removeItem('loc/'+key);
      try{ const [c,id]=sk(key); await fb('DELETE', c+'/'+id); return {synced:true}; }catch(e){ return {synced:false}; }
    }
    if(shared){
      const db = await getDb();
      LS.removeItem('loc/'+key);
      if(db){ try{ const [c,id]=sk(key); await db.doc(c+'/'+id).delete(); return {synced:true}; }catch(e){ return {synced:false}; } }
      return {synced:false};
    }
    LS.removeItem('mine/'+key); return {ok:true};
  },
  async list(prefix, shared){
    if(!shared) return { keys: lsKeys('mine/'+prefix).map(k=>prefix+k) };
    if(API){ try{ const c = prefix.replace(/:$/,''); const j = await api({op:'list', c}); return { keys: (j.keys||[]).map(i=>c+':'+i) }; }catch(e){} return { keys: [] }; }
    if(FB){ try{ const c = prefix.replace(/:$/,''); const o = await fb('GET', c+'?shallow=true'); return { keys: Object.keys(o||{}).map(i=>c+':'+i) }; }catch(e){} return { keys: lsKeys('loc/'+prefix).map(k=>prefix+k) }; }
    const db = await getDb();
    if(db){ try{ const c = prefix.replace(/:$/,''); const sn = await db.collection(c).get(); return { keys: sn.docs.map(d=>c+':'+d.id) }; }catch(e){} }
    return { keys: lsKeys('loc/'+prefix).map(k=>prefix+k) };
  },
  async all(prefix){
    if(API){
      try{ const c = prefix.replace(/:$/,''); const j = await api({op:'all', c});
        return (j.values||[]).map(v=>{ try{ return JSON.parse(v); }catch(e){ return null; } }).filter(Boolean); }catch(e){ return []; }
    }
    if(FB){
      try{
        const c = prefix.replace(/:$/,''); const o = await fb('GET', c) || {};
        return Object.values(o).map(d=>{ try{ return JSON.parse(d.value); }catch(e){ return null; } }).filter(Boolean);
      }catch(e){ return lsKeys('loc/'+prefix).map(k=>{ try{ return JSON.parse(LS.getItem('loc/'+prefix+k)); }catch(_){ return null; } }).filter(Boolean); }
    }
    const db = await getDb();
    if(db){
      try{
        const c = prefix.replace(/:$/,''); const sn = await db.collection(c).get();
        return sn.docs.map(d=>{ try{ return JSON.parse(d.data().value); }catch(e){ return null; } }).filter(Boolean);
      }catch(e){}
    }
    return lsKeys('loc/'+prefix).map(k=>{ try{ return JSON.parse(LS.getItem('loc/'+prefix+k)); }catch(e){ return null; } }).filter(Boolean);
  },
  async watch(prefix, cb){
    if(API || FB){
      let last = '';
      const tick = async ()=>{ const a = await window.storage.all(prefix); const j = JSON.stringify(a); if(j !== last){ last = j; cb(a); } };
      tick(); const t = setInterval(tick, 4000);
      return ()=>clearInterval(t);
    }
    const db = await getDb();
    if(db){
      try{
        const c = prefix.replace(/:$/,'');
        return db.collection(c).onSnapshot(sn=>{
          cb(sn.docs.map(d=>{ try{ return JSON.parse(d.data().value); }catch(e){ return null; } }).filter(Boolean));
        }, ()=>{});
      }catch(e){}
    }
    const t = setInterval(async ()=>cb(await window.storage.all(prefix)), 5000);
    return ()=>clearInterval(t);
  },
  async auth(pin){ if(!API) return false; try{ const j = await api({op:'auth', pin}); if(j.ok) SESSION_PIN = pin; return !!j.ok; }catch(e){ return 'error'; } },
  async health(){ if(!API) return { ok:true }; try{ await api({op:'health'}); return { ok:true }; }catch(e){ return { ok:false, error:String(e.message||e) }; } },
  async mode(){ if(API) return 'api'; if(FB) return 'firebase'; return (await getDb()) ? 'db' : 'local'; }
};
function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(msg){
  let t = document.getElementById('toastBox');
  if(!t){ t = document.createElement('div'); t.id='toastBox';
    t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#243441;color:#fff;padding:12px 18px;border-radius:8px;z-index:99;max-width:90%;font-size:14px;box-shadow:0 4px 18px rgba(0,0,0,.5);';
    document.body.appendChild(t); }
  t.textContent = msg; t.style.display='block';
  clearTimeout(t._h); t._h = setTimeout(()=>{ t.style.display='none'; }, 4500);
}

/* ---------- Datos del evento (vienen de config.js) ---------- */
const EV = window.EVENTO || {};
const MEALS = (EV.comidas && EV.comidas.length) ? EV.comidas : [{dia:1, tipo:'Comida'}];
const MONEDA = EV.moneda || 'L.';
const PRECIO_TOTAL = Number(EV.precioTotal) || 0, PRECIO_RESERVA = Number(EV.reserva) || 0;
const SIGLAS = String(EV.siglas || 'EVT').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'EVT';
function lempiras(n){ return MONEDA + Number(n||0).toLocaleString('en-US'); }
function aplicarEvento(sufijoTitulo){
  const r = document.documentElement;
  const textos = {
    nombre: EV.nombre || '', tema: EV.tema || '', anio: EV.anio || '', lugar: EV.lugar || '',
    fechaTexto: EV.fechaTexto || '', fechaLimite: EV.fechaLimite || '', siglas: SIGLAS,
    precioTotal: lempiras(PRECIO_TOTAL), reserva: lempiras(PRECIO_RESERVA), saldoReserva: lempiras(PRECIO_TOTAL - PRECIO_RESERVA),
    banco: (EV.banco && EV.banco.nombre) || '', nroComidas: String(MEALS.length), edadAviso: String(EV.edadAviso || 12),
    ejemploCodigo: SIGLAS + '-XXXXXX'
  };
  document.querySelectorAll('[data-ev]').forEach(el => { const k = el.getAttribute('data-ev'); if(k in textos) el.textContent = textos[k]; });
  document.querySelectorAll('[data-ev-ph]').forEach(el => { const k = el.getAttribute('data-ev-ph'); if(k in textos) el.placeholder = textos[k]; });
  const img = EV.imagenes || {};
  document.querySelectorAll('img[data-ev-img]').forEach(el => { const k = el.getAttribute('data-ev-img'); if(img[k]){ el.src = img[k]; } else { el.style.display = 'none'; } });
  if(img.banner) r.style.setProperty('--theme-img', 'url("' + img.banner + '")');
  if(EV.colorAcento) r.style.setProperty('--ember', EV.colorAcento);
  if(EV.colorAcentoOscuro) r.style.setProperty('--ember-dark', EV.colorAcentoOscuro);
  document.title = (EV.nombre || 'Evento') + (sufijoTitulo ? ' — ' + sufijoTitulo : '');
}
const ADMIN_PIN = ''; // el PIN real vive en Vercel (ADMIN_PIN), no aquí

/* ---------- Código QR del campista e imagen para guardar o compartir ---------- */
function qrPayload(registro){
  // Un solo QR por campista: sirve para el registro en mesa, la entrada y las 9 comidas.
  return JSON.stringify({ t: SIGLAS.toLowerCase(), id: registro.id, n: registro.nombreCompleto, i: registro.iglesia });
}


function qrCanvas(payload, size){
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-9999px;top:0;';
  document.body.appendChild(holder);
  new QRCode(holder, { text: payload, width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
  const cv = holder.querySelector('canvas');
  const out = document.createElement('canvas'); out.width = size; out.height = size;
  out.getContext('2d').drawImage(cv, 0, 0);
  holder.remove();
  return out;
}
function wrapText(ctx, text, x, y, maxW, lh){
  const words = String(text).split(' '); let line = '';
  for(const w of words){
    const t = line ? line + ' ' + w : w;
    if(ctx.measureText(t).width > maxW && line){ ctx.fillText(line, x, y); line = w; y += lh; } else line = t;
  }
  ctx.fillText(line, x, y); return y + lh;
}
function buildTicketCanvas(registro, aprobado){
  const W = 900, pad = 40;
  const items = [{ label: aprobado ? 'REGISTRO, ENTRADA Y 9 COMIDAS' : 'REGISTRO (pendiente de aprobación)', payload: qrPayload(registro) }];
  const qrSize = 440;
  const c = document.createElement('canvas'); c.width = W; c.height = 1200;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F5F8FA'; ctx.fillRect(0,0,W,1200);
  ctx.fillStyle = '#1C2832'; ctx.fillRect(0,0,W,120);
  ctx.fillStyle = '#E8B23D'; ctx.textAlign = 'center';
  ctx.font = '48px "Archivo Black", Arial Black, sans-serif'; ctx.fillText((EV.nombre || '') + (EV.anio ? ' ' + EV.anio : ''), W/2, 62);
  ctx.fillStyle = '#F5F8FA'; ctx.font = '26px Karla, Arial, sans-serif'; ctx.fillText(EV.tema || '', W/2, 100);
  ctx.fillStyle = '#1F2A33'; ctx.font = 'bold 40px Karla, Arial, sans-serif';
  let y = wrapText(ctx, registro.nombreCompleto, W/2, 190, W - pad*2, 48);
  ctx.fillStyle = '#506476'; ctx.font = '30px Karla, Arial, sans-serif';
  y = wrapText(ctx, registro.iglesia || '', W/2, y + 4, W - pad*2, 38);
  ctx.font = '56px "Archivo Black", Arial Black, sans-serif';
  const idW = ctx.measureText(registro.id).width + 80, idH = 92, idX = (W - idW)/2, idY = y + 6;
  ctx.fillStyle = '#243441'; ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(idX, idY, idW, idH, 46); else ctx.rect(idX, idY, idW, idH);
  ctx.fill();
  ctx.fillStyle = '#E8B23D'; ctx.textBaseline = 'middle'; ctx.fillText(registro.id, W/2, idY + idH/2 + 2); ctx.textBaseline = 'alphabetic';
  y = idY + idH - 40;
  y += 110;
  const n = items.length, colW = (W - pad*2) / n;
  items.forEach((it,i)=>{
    const cx = pad + colW*i + colW/2;
    const q = qrCanvas(it.payload, qrSize);
    ctx.fillStyle = '#fff'; ctx.fillRect(cx - qrSize/2 - 36, y - 36, qrSize + 72, qrSize + 72);
    ctx.drawImage(q, cx - qrSize/2, y);
    ctx.fillStyle = '#1F2A33'; ctx.font = 'bold 28px Karla, Arial, sans-serif';
    ctx.fillText(it.label, cx, y + qrSize + 100);
  });
  const h = y + qrSize + 175;
  ctx.fillStyle = '#506476'; ctx.font = '24px Karla, Arial, sans-serif';
  ctx.fillText('Guarda esta imagen. La necesitarás en el campamento.', W/2, h - 30);
  const out = document.createElement('canvas'); out.width = W; out.height = h;
  out.getContext('2d').drawImage(c, 0, 0);
  return out;
}
async function saveTicketImage(registro, aprobado, msgEl){
  msgEl.textContent = 'Preparando imagen…';
  let cv;
  try{ cv = buildTicketCanvas(registro, aprobado); }catch(e){ msgEl.textContent = 'No se pudo crear la imagen. Toma una captura de pantalla.'; return; }
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  const file = new File([blob], registro.id + '.png', { type:'image/png' });
  try{
    if(navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({ files:[file], title:(EV.nombre || 'Evento') + ' — ' + registro.id });
      msgEl.textContent = 'Si elegiste "Guardar imagen", ya está en tus fotos.';
      return;
    }
  }catch(e){
    if(e && e.name === 'AbortError'){ msgEl.textContent = ''; return; }
  }
  // Respaldo: mostrar la imagen para guardarla manualmente
  const url = URL.createObjectURL(blob);
  const ov = document.createElement('div'); ov.className = 'photo-overlay';
  ov.innerHTML = `<p>Mantén presionada la imagen y elige <b>Guardar en Fotos</b> (o "Guardar imagen").</p>
    <img src="${url}" alt="Tus códigos">
    <a class="primary" style="padding:12px 18px;border-radius:6px;text-decoration:none;background:var(--ember);color:#2A2100;" href="${url}" download="${registro.id}.png">Descargar imagen</a>
    <button class="ghost" id="closePhotoOv">Cerrar</button>`;
  document.body.appendChild(ov);
  ov.querySelector('#closePhotoOv').onclick = () => { ov.remove(); URL.revokeObjectURL(url); };
  msgEl.textContent = '';
}

/* ---------- Pagos: reserva (L.300) o pago completo (L.1,500) ---------- */
function pagoInfo(r){
  const p = r && r.pago;
  if(p === 'completo') return { clave:'completo', pagado:PRECIO_TOTAL, saldo:0, texto:'Pago completo ' + lempiras(PRECIO_TOTAL) };
  if(p === 'reserva') return { clave:'reserva', pagado:PRECIO_RESERVA, saldo:PRECIO_TOTAL-PRECIO_RESERVA, texto:'Reserva ' + lempiras(PRECIO_RESERVA) + ' · debe ' + lempiras(PRECIO_TOTAL-PRECIO_RESERVA) };
  return { clave:'sin', pagado:0, saldo:PRECIO_TOTAL, texto:'Pago sin definir' };
}
