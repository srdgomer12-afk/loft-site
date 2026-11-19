/* GET /api/bootstrap: sayfa açılırken güncel içeriği doğrudan yükler (eski içerik görünüp değişmesin).
   Veritabanı yoksa ya da hata olursa site, dosyalardaki varsayılan içerikle sorunsuz açılır. */
import { getSite } from '../_lib/util.js';

export async function onRequestGet({ env }) {
  let payload = null;
  try { payload = await getSite(env); } catch (e) { /* varsayılan içerik */ }
  const js = 'window.LOFT_LIVE=' + JSON.stringify(payload).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ';';
  return new Response(js, {
    headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' }
  });
}
