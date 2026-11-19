/* LOFT — ortak yardımcılar: veritabanı, oturum, doğrulama */
const enc = new TextEncoder();
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const ICONS = ['cup', 'mug', 'iced', 'cake', 'plate', 'bean', 'lamp', 'window', 'vase'];
const SESSION_MS = 7 * 24 * 3600 * 1000;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}

/* ---------- Veritabanı (Cloudflare D1) ---------- */
let ready = false;
export async function db(env) {
  if (!env.DB) throw new Error('DB_MISSING');
  if (!ready) {
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS site (id INTEGER PRIMARY KEY CHECK (id = 1), rev INTEGER NOT NULL, content TEXT NOT NULL, updated INTEGER NOT NULL)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, mime TEXT NOT NULL, data TEXT NOT NULL, created INTEGER NOT NULL)"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS attempts (ip TEXT PRIMARY KEY, n INTEGER NOT NULL, first INTEGER NOT NULL)")
    ]);
    ready = true;
  }
  return env.DB;
}

export async function getSite(env) {
  const d = await db(env);
  const row = await d.prepare('SELECT rev, content FROM site WHERE id = 1').first();
  if (!row) return { rev: 0, content: {} };
  let content = {};
  try { content = JSON.parse(row.content); } catch (e) { /* bozuk kayıt: varsayılana dön */ }
  return { rev: row.rev, content };
}

/* ---------- Oturum (HMAC imzalı çerez) ---------- */
function b64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg))));
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export async function passwordOk(env, input) {
  if (!env.ADMIN_PASSWORD) return false;
  const a = await hmac('loft-pw', String(input || ''));
  const b = await hmac('loft-pw', env.ADMIN_PASSWORD);
  return safeEqual(a, b);
}
export async function sessionCookie(env) {
  const exp = String(Date.now() + SESSION_MS);
  const token = exp + '.' + await hmac('loft-session:' + env.ADMIN_PASSWORD, exp);
  return 'loft_admin=' + token + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + SESSION_MS / 1000;
}
export const clearCookie = 'loft_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

export async function isAuthed(request, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const m = /(?:^|;\s*)loft_admin=([^;]+)/.exec(request.headers.get('cookie') || '');
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(sig, await hmac('loft-session:' + env.ADMIN_PASSWORD, exp));
}

/* Değiştiren istekler: oturum + aynı site + özel başlık (CSRF koruması) */
export async function guard(request, env) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Geçersiz istek kaynağı.' }, 403);
  if (request.headers.get('x-requested-with') !== 'loft-admin') return json({ error: 'Geçersiz istek.' }, 403);
  if (!(await isAuthed(request, env))) return json({ error: 'Oturum gerekli.' }, 401);
  return null;
}

/* ---------- İçerik doğrulama ---------- */
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const httpUrl = (v, max) => { const s = str(v, max); return /^https?:\/\//i.test(s) ? s : ''; };

export function sanitize(input) {
  const c = input && typeof input === 'object' ? input : {};
  const out = {};

  if (c.config && typeof c.config === 'object') {
    const k = c.config;
    const insta = str(k.instagram, 200);
    out.config = {
      demo: !!k.demo,
      phone: str(k.phone, 40),
      address: str(k.address, 300),
      instagram: /^https?:\/\//i.test(insta) || !/[:/]/.test(insta) ? insta : '',
      mapEmbedUrl: /^https:\/\//i.test(str(k.mapEmbedUrl, 1200)) ? str(k.mapEmbedUrl, 1200) : '',
      directionsUrl: httpUrl(k.directionsUrl, 600),
      hours: DAYS.map((day, i) => ({ day, time: str(Array.isArray(k.hours) && k.hours[i] && k.hours[i].time, 40) }))
    };
  }

  if (Array.isArray(c.menu)) {
    const seen = new Set();
    out.menu = c.menu.slice(0, 20).map((cat) => {
      const id = str(cat && cat.id, 30).toLowerCase().replace(/[^a-z0-9-]/g, '');
      const name = str(cat && cat.name, 60);
      if (!id || !name || seen.has(id)) return null;
      seen.add(id);
      return {
        id, name,
        art: ICONS.includes(cat.art) ? cat.art : 'bean',
        lead: str(cat.lead, 200),
        note: str(cat.note, 200),
        items: (Array.isArray(cat.items) ? cat.items : []).slice(0, 60).map((it) => {
          const n = str(it && it.name, 80);
          if (!n) return null;
          let price = null;
          if (typeof it.price === 'number' && isFinite(it.price) && it.price >= 0) price = it.price;
          else if (typeof it.price === 'string' && it.price.trim()) price = it.price.trim().slice(0, 30);
          return { name: n, desc: str(it.desc, 160), price, badge: str(it.badge, 20) };
        }).filter(Boolean)
      };
    }).filter(Boolean);
  }

  if (c.texts && typeof c.texts === 'object') {
    out.texts = {};
    Object.keys(c.texts).slice(0, 60).forEach((key) => {
      const v = str(c.texts[key], 600);
      if (/^[a-zA-Z0-9]{1,40}$/.test(key) && v) out.texts[key] = v;
    });
  }

  if (c.images && typeof c.images === 'object') {
    out.images = {};
    Object.keys(c.images).slice(0, 80).forEach((slot) => {
      const v = c.images[slot];
      /* "" = fotoğraf bilinçli olarak kaldırıldı (dosyadaki varsayılan görsele dönülmesin) */
      if (/^(hero|about-[123]|g[1-9]|menu-[a-z0-9-]{1,30})$/.test(slot) && typeof v === 'string' && (v === '' || /^\/api\/img\/[a-f0-9]{16,32}$/.test(v))) out.images[slot] = v;
    });
  }
  return out;
}

export function imageIds(content) {
  return Object.values((content && content.images) || {}).filter(Boolean).map((u) => u.split('/').pop());
}

export { b64url };
