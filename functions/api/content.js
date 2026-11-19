/* GET /api/content: yayındaki tüm site içeriği */
import { getSite, json } from '../_lib/util.js';

export async function onRequestGet({ env }) {
  try { return json(await getSite(env)); }
  catch (e) { return json({ error: 'unavailable' }, 503); }
}
