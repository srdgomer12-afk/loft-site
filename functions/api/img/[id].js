/* GET /api/img/<id>: yüklenen fotoğraflar. Adres her yüklemede değiştiği için kalıcı önbelleğe alınır. */
import { db } from '../../_lib/util.js';

export async function onRequestGet({ env, params }) {
  const id = String(params.id || '');
  if (!/^[a-f0-9]{16,32}$/.test(id)) return new Response('Not found', { status: 404 });
  try {
    const d = await db(env);
    const row = await d.prepare('SELECT mime, data FROM images WHERE id = ?').bind(id).first();
    if (!row) return new Response('Not found', { status: 404 });
    const bin = atob(row.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(bytes, {
      headers: {
        'content-type': row.mime,
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff'
      }
    });
  } catch (e) {
    return new Response('Unavailable', { status: 503 });
  }
}
