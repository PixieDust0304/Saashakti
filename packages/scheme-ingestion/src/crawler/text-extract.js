export function htmlToText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractLinks(html) {
  const links = [];
  const regex = /href=["']([^"'#]+)["']/gi;
  let m;
  while ((m = regex.exec(html))) links.push(m[1]);
  return links;
}

export function extractTitle(html) {
  const m = html.match(/<title>(.*?)<\/title>/i);
  return m?.[1]?.trim() || null;
}
