import { extractMySchemePage } from '../extractors/myscheme.js';
import { extractIndiaGovPage } from '../extractors/india-gov.js';
import { extractGenericGovPage } from '../extractors/generic-gov.js';

export async function runExtract(documents) {
  const candidates = [];
  for (const doc of documents) {
    const host = doc.sourceHost || '';
    let extracted = null;
    if (host.includes('myscheme.gov.in')) {
      extracted = extractMySchemePage({ url: doc.sourceUrl, text: doc.rawText, html: doc.rawHtml });
    } else if (host.includes('india.gov.in')) {
      extracted = extractIndiaGovPage({ url: doc.sourceUrl, text: doc.rawText, html: doc.rawHtml });
    } else if (host.endsWith('.gov.in') || host.includes('.nic.in')) {
      extracted = extractGenericGovPage({ url: doc.sourceUrl, text: doc.rawText, html: doc.rawHtml, stateCode: guessState(doc.sourceUrl), authority: guessAuthority(doc.sourceUrl) });
    }
    if (extracted) candidates.push(extracted);
  }
  return candidates;
}

function guessState(url) { return /chhattisgarh|raipur|rajnandgaon|korba|cg/i.test(url) ? 'CG' : null; }
function guessAuthority(url) { return /district|nic\.in/i.test(url) ? 'district' : 'state'; }
