// Cliente mínimo para Upstash Redis (REST). Vercel añade estas variables al conectar la base.
// Busca las variables aunque Vercel les haya puesto un prefijo (por ejemplo STORAGE_KV_REST_API_URL).
function findEnv(re){
  const key = Object.keys(process.env).find(k => re.test(k) && process.env[k]);
  return key ? process.env[key] : undefined;
}
const URL_ = findEnv(/(^|_)(KV_REST_API_URL|UPSTASH_REDIS_REST_URL)$/);
const TOKEN = findEnv(/(^|_)(KV_REST_API_TOKEN|UPSTASH_REDIS_REST_TOKEN)$/);

async function cmd(...args){
  if(!URL_ || !TOKEN) throw new Error('La base de datos no está conectada al proyecto de Vercel (faltan las variables KV_REST_API_URL y KV_REST_API_TOKEN). En Vercel: Storage → conecta la base Upstash al proyecto y haz Redeploy.');
  const r = await fetch(URL_, { method:'POST', headers:{ Authorization:'Bearer '+TOKEN, 'Content-Type':'application/json' }, body: JSON.stringify(args) });
  const j = await r.json().catch(()=>({ error:'La base de datos respondió algo inesperado (HTTP '+r.status+').' }));
  if(j.error) throw new Error('Error de la base de datos: ' + j.error);
  return j.result;
}
module.exports = { cmd };
