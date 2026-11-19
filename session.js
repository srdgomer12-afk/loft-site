/* GET: oturum durumu · POST: giriş · DELETE: çıkış */
import { db, json, isAuthed, passwordOk, sessionCookie, clearCookie } from '../../_lib/util.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 5;

export async function onRequestGet({ request, env }) {
  let dbOk = true;
  try { await db(env); } catch (e) { dbOk = false; }
  return json({ authed: await isAuthed(request, env), passwordSet: !!env.ADMIN_PASSWORD, dbOk });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Geçersiz istek kaynağı.' }, 403);
  if (!env.ADMIN_PASSWORD) return json({ error: 'ADMIN_PASSWORD tanımlı değil.' }, 500);

  let d;
  try { d = await db(env); } catch (e) { return json({ error: 'Veritabanı bağlı değil.' }, 500); }

  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const now = Date.now();
  let rec = await d.prepare('SELECT n, first FROM attempts WHERE ip = ?').bind(ip).first();
  if (rec && now - rec.first > WINDOW_MS) { rec = null; await d.prepare('DELETE FROM attempts WHERE ip = ?').bind(ip).run(); }
  if (rec && rec.n >= MAX_TRIES) {
    const wait = Math.ceil((WINDOW_MS - (now - rec.first)) / 60000);
    return json({ error: 'Çok fazla hatalı deneme. ' + wait + ' dakika sonra tekrar deneyin.' }, 429);
  }

  let body = {};
  try { body = await request.json(); } catch (e) { /* boş */ }

  if (!(await passwordOk(env, body.password))) {
    await d.prepare('INSERT INTO attempts (ip, n, first) VALUES (?, 1, ?) ON CONFLICT(ip) DO UPDATE SET n = n + 1').bind(ip, now).run();
    return json({ error: 'Şifre hatalı.' }, 401);
  }
  await d.prepare('DELETE FROM attempts WHERE ip = ?').bind(ip).run();
  return json({ ok: true }, 200, { 'set-cookie': await sessionCookie(env) });
}

export async function onRequestDelete() {
  return json({ ok: true }, 200, { 'set-cookie': clearCookie });
}
