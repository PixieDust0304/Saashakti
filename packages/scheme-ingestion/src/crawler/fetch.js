export async function fetchPage(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET', redirect: 'follow', signal: controller.signal,
      headers: { 'user-agent': 'SaashaktiSchemeIngestion/0.1', 'accept-language': 'en-IN,en;q=0.9,hi;q=0.8' },
    });
    const html = await res.text();
    return { url, ok: res.ok, status: res.status, contentType: res.headers.get('content-type') || '', html };
  } catch (err) {
    return { url, ok: false, status: 0, contentType: '', html: '', error: err.message };
  } finally { clearTimeout(timer); }
}
