/* GET /api/live: ziyaretçi sayfaları buraya bakar; yalnızca sürüm numarasını döner (çok hafif). */
import { db, json } from '../_lib/util.js';

export async function onRequestGet({ env }) {
  try {
    const d = await db(env);
    const row = await d.prepare('SELECT rev FROM site WHERE id = 1').first();
    return json({ rev: row ? row.rev : 0 });
  } catch (e) {
    return json({ error: 'unavailable' }, 503);
  }
}
