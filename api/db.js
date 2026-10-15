const { cmd } = require('./_kv');

const ADMIN_PIN = process.env.ADMIN_PIN || '961271';
const SCANNER_PIN = process.env.SCANNER_PIN || '2121';
// Si usas la misma base de datos para varios eventos, pon una variable EVENT_ID distinta en cada proyecto de Vercel
// (por ejemplo: ciy2027, retiro2027). Cada evento queda separado. Si no la pones, funciona como siempre.
const NS = process.env.EVENT_ID ? String(process.env.EVENT_ID).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) + ':' : '';
const MAX_COMIDAS = 40;
const ID_RE = /^[A-Z0-9]{2,8}-[A-Z0-9]{6}$/;
const COLLECTIONS = ['registrations', 'receipts'];
// Personas en un registro: 1, o la familia completa (pastor + esposa + hijos) si viene de la calculadora
function personas(r){ const f = r && r.familia; if(!f) return 1; return 1 + (f.esposa ? 1 : 0) + ((f.hijos || []).length); }

module.exports = async (req, res) => {
  try{
    if(req.method !== 'POST') return res.status(405).json({ error:'method' });
    const { op, c, id, value, pin } = req.body || {};
    const admin = pin === ADMIN_PIN;

    if(op === 'auth') return res.json({ ok: admin });

    // --- Escáner de comidas: acceso limitado (PIN propio o PIN de administrador) ---
    const scanner = admin || pin === SCANNER_PIN;
    if(op === 'scan_auth') return res.json({ ok: scanner });
    if(op === 'counts' || op === 'scan'){
      if(!scanner) return res.status(403).json({ error:'scanner' });
      if(op === 'counts'){
        const vals = (await cmd('HVALS', NS + 'registrations')) || [];
        const meals = []; let entradas = 0, aprobados = 0, completos = 0, reservas = 0, sinPago = 0;
        vals.forEach(v => { try{
          const r = JSON.parse(v);
          const np = personas(r);
          if(r.estado === 'aprobado'){ aprobados += np; if(r.pago === 'completo') completos++; else if(r.pago === 'reserva') reservas++; else sinPago++; }
          if(r.entradaEscaneada && r.entradaEscaneada.usado) entradas += np;
          (r.comidas || []).forEach((m,i) => { if(i < MAX_COMIDAS){ while(meals.length <= i) meals.push(0); if(m && m.usado) meals[i] += np; } });
        }catch(e){} });
        return res.json({ meals, entradas, aprobados, inscritos: vals.length, completos, reservas, sinPago });
      }
      // op === 'scan': registra una comida (o la entrada con mode 'e') de un participante aprobado
      const sid = String(id || ''), mode = String(req.body.mode);
      if(!ID_RE.test(sid)) return res.json({ status:'notfound' });
      if(mode !== 'e' && !(/^\d+$/.test(mode) && +mode < MAX_COMIDAS)) return res.status(400).json({ error:'mode' });
      if(mode === 'e' && !admin) return res.status(403).json({ error:'admin' }); // la entrada al retiro solo la registra el administrador
      const raw = await cmd('HGET', NS + 'registrations', sid);
      if(!raw) return res.json({ status:'notfound' });
      const rec = JSON.parse(raw);
      const info = { nombre: rec.nombreCompleto, iglesia: rec.iglesia, alergias: rec.tieneAlergias ? (rec.alergias || 'Sin detalle') : '', fn: rec.fechaNacimiento || '', personas: personas(rec), familia: rec.familia || null,
        pago: rec.pago === 'completo' ? 'completo' : rec.pago === 'reserva' ? 'reserva' : 'sin' };
      if(rec.estado === 'pendiente') return res.json(Object.assign({ status:'pending' }, info));
      if(rec.estado !== 'aprobado') return res.json(Object.assign({ status:'rejected' }, info));
      if(mode !== 'e'){ rec.comidas = rec.comidas || []; while(rec.comidas.length <= +mode) rec.comidas.push({ usado:false, hora:null }); }
      const slot = mode === 'e' ? rec.entradaEscaneada : rec.comidas[+mode];
      if(slot && slot.usado) return res.json(Object.assign({ status:'dup', hora: slot.hora }, info));
      const nuevo = { usado:true, hora: new Date().toISOString() };
      if(mode === 'e') rec.entradaEscaneada = nuevo; else rec.comidas[+mode] = nuevo;
      await cmd('HSET', NS + 'registrations', sid, JSON.stringify(rec));
      return res.json(Object.assign({ status:'ok', hora: nuevo.hora }, info));
    }
    if(op === 'health'){
      if(!admin) return res.status(403).json({ error:'admin' });
      await cmd('PING');
      return res.json({ ok:true });
    }
    if(!COLLECTIONS.includes(c)) return res.status(400).json({ error:'colección' });
    const K = NS + c; // nombre real de la colección en la base de datos
    if(id !== undefined && !/^[A-Za-z0-9_-]{3,60}$/.test(String(id))) return res.status(400).json({ error:'id' });

    if(op === 'get'){
      if(c === 'receipts' && !admin) return res.status(403).json({ error:'admin' });
      const v = await cmd('HGET', K, id);
      if(c === 'registrations' && v && !admin){
        // El participante (o quien conozca el teléfono) solo recibe lo necesario para mostrar sus códigos.
        try{
          const r = JSON.parse(v);
          return res.json({ value: JSON.stringify({ id:r.id, nombreCompleto:r.nombreCompleto, iglesia:r.iglesia, estado:r.estado, creado:r.creado, familia:r.familia, costoFamilia:r.costoFamilia, depositoRequerido:r.depositoRequerido, entradaEscaneada:r.entradaEscaneada, comidas:r.comidas }) });
        }catch(e){}
      }
      return res.json({ value: v || null });
    }
    if(op === 'all'){
      if(!admin) return res.status(403).json({ error:'admin' });
      const vals = await cmd('HVALS', K);
      return res.json({ values: vals || [] });
    }
    if(op === 'list'){
      if(!admin) return res.status(403).json({ error:'admin' });
      return res.json({ keys: (await cmd('HKEYS', K)) || [] });
    }
    if(op === 'delete'){
      if(!admin) return res.status(403).json({ error:'admin' });
      await cmd('HDEL', K, id);
      return res.json({ ok:true });
    }
    if(op === 'set'){
      if(typeof value !== 'string' || value.length > 900000) return res.status(400).json({ error:'valor' });
      if(!admin && !ID_RE.test(String(id))) return res.status(400).json({ error:'id' });
      const exists = await cmd('HEXISTS', K, id);
      if(exists && !admin) return res.json({ ok:true, exists:true }); // un participante no puede modificar un registro existente
      let out = value;
      if(!exists && c === 'registrations'){
        // Registro nuevo: siempre entra como pendiente; solo un administrador lo aprueba.
        const rec = JSON.parse(value);
        rec.estado = 'pendiente';
        rec.entradaEscaneada = { usado:false, hora:null };
        rec.comidas = (rec.comidas || []).map(()=>({ usado:false, hora:null }));
        delete rec.revisadoManualmente;
        delete rec.pago; delete rec.montoPagado;
        out = JSON.stringify(rec);
      }
      await cmd('HSET', K, id, out);
      return res.json({ ok:true, value: out });
    }
    return res.status(400).json({ error:'op' });
  }catch(e){
    return res.status(500).json({ error: String(e.message || e) });
  }
};
