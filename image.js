/* POST /api/admin/image: ham görsel baytlarını alır, kimliğini döner. */
import { db, json, guard } from '../../_lib/util.js';

const MAX_BYTES = 900 * 1024;

function mimeOf(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}

export async function onRequestPost({ request, env }) {
  const denied = await guard(request, env);
  if (denied) return denied;

  const buf = new Uint8Array(await request.arrayBuffer());
  if (!buf.length) return json({ error: 'Dosya boş.' }, 400);
  if (buf.length > MAX_BYTES) return json({ error: 'Fotoğraf 900 KB sınırını aşıyor.' }, 413);
  const mime = mimeOf(buf);
  if (!mime) return json({ error: 'Yalnızca JPG, PNG ya da WebP yüklenebilir.' }, 415);

  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));

  const id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => x.toString(16).padStart(2, '0')).join('');
  const d = await db(env);
  await d.prepare('INSERT INTO images (id, mime, data, created) VALUES (?, ?, ?, ?)').bind(id, mime, btoa(bin), Date.now()).run();
  return json({ id, url: '/api/img/' + id });
}
