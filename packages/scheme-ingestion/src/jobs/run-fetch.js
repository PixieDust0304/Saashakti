import crypto from 'node:crypto';
import { fetchPage } from '../crawler/fetch.js';
import { htmlToText, extractTitle } from '../crawler/text-extract.js';

export async function runFetch(urls) {
  const results = [];
  for (const url of urls) {
    const page = await fetchPage(url);
    const rawText = htmlToText(page.html);
    results.push({
      sourceUrl: url,
      sourceHost: new URL(url).host,
      sourceType: guessSourceType(url),
      httpStatus: page.status,
      contentType: page.contentType,
      title: extractTitle(page.html),
      rawHtml: page.html,
      rawText,
      checksum: crypto.createHash('sha256').update(rawText || '').digest('hex'),
    });
  }
  return results;
}

function guessSourceType(url) {
  if (url.includes('myscheme')) return 'myscheme';
  if (url.includes('india.gov')) return 'india_gov';
  if (url.includes('.nic.in')) return 'district_portal';
  return 'generic_gov';
}
