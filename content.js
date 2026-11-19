/* PUT /api/admin/content: değişiklikleri yayınlar. Kayıt anında tüm ziyaretçilere ulaşır. */
import { db, json, guard, sanitize, imageIds } from '../../_lib/util.js';

export async function onRequestPut({ request, env }) {
  const denied = await guard(request, env);
  if (denied) return denied;

  const raw = await request.text();
  if (raw.length > 300000) return json({ error: 'İçerik çok büyük.' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch (e) { return json({ error: 'Geçersiz veri.' }, 400); }

  const content = sanitize(body.content);
  const baseRev = Number(body.baseRev) || 0;
  const d = await db(env);

  /* Karşılaştır-ve-yaz: başka bir oturum araya girdiyse hiçbir şey yazılmaz */
  const res = await d.prepare(
    'INSERT INTO site (id, rev, content, updated) VALUES (1, ?, ?, ?) ' +
    'ON CONFLICT(id) DO UPDATE SET rev = excluded.rev, content = excluded.content, updated = excluded.updated WHERE site.rev = ?'
  ).bind(baseRev + 1, JSON.stringify(content), Date.now(), baseRev).run();

  if (!res.meta || !res.meta.changes) {
    const cur = await d.prepare('SELECT rev FROM site WHERE id = 1').first();
    return json({ error: 'Bu sırada başka bir yerden değişiklik yapıldı. Sayfayı yenileyip tekrar deneyin.', rev: cur ? cur.rev : 0 }, 409);
  }

  /* Kullanılmayan eski fotoğrafları temizle (son 10 dakikadakiler yüklenmekte olabilir, dokunma) */
  const keep = imageIds(content);
  const marks = keep.map(() => '?').join(',');
  await d.prepare('DELETE FROM images WHERE created < ?' + (keep.length ? ' AND id NOT IN (' + marks + ')' : ''))
    .bind(Date.now() - 600000, ...keep).run();

  return json({ ok: true, rev: baseRev + 1, content });
}
