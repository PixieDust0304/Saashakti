
import { isCandidateUrl, normalizeUrl, isSameHost } from '../crawler/url-filter.js';
import { htmlToText, extractLinks, extractTitle } from '../crawler/text-extract.js';
import { suggestRulesFromText, extractBenefitAmount } from '../normalize/enhanced-rule-suggester.js';
import { extractMySchemeRendered } from '../extractors/myscheme-rendered.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; } 
  else { failed++; console.error(`  ❌ FAIL: ${msg}`); }
}

console.log('=== SCHEME INGESTION SMOKE TESTS ===\n');

// URL filter
assert(isCandidateUrl('https://example.gov.in/scheme/xyz'), 'scheme URL detected');
assert(isCandidateUrl('https://example.gov.in/yojana/abc'), 'yojana URL detected');
assert(!isCandidateUrl('https://example.gov.in/logo.png'), 'image blocked');
assert(!isCandidateUrl('mailto:test@example.com'), 'mailto blocked');
assert(isSameHost('https://example.gov.in/', 'https://example.gov.in/page'), 'same host');
assert(!isSameHost('https://a.gov.in/', 'https://b.gov.in/'), 'different host');

// Text extraction
const html = '<html><script>var x=1;</script><style>.a{}</style><p>Hello World</p></html>';
assert(htmlToText(html) === 'Hello World', 'text extraction');
assert(extractLinks('<a href="/test">x</a><a href="/abc">y</a>').length === 2, 'link extraction');
assert(extractTitle('<title>Test Page</title>') === 'Test Page', 'title extraction');

// Rule suggestion
const rules1 = suggestRulesFromText('Eligible for pregnant women aged 19+ from BPL families with bank account', '', '');
assert(rules1.some(r => r.field === 'isPregnant'), 'pregnant rule');
assert(rules1.some(r => r.field === 'isBpl'), 'BPL rule');
assert(rules1.some(r => r.field === 'hasBankAccount'), 'bank account rule');
assert(rules1.some(r => r.field === 'age' && r.value === 19), 'age rule');

const rules2 = suggestRulesFromText('For widows and divorced women in Chhattisgarh', '', '');
assert(rules2.some(r => r.field === 'maritalStatus'), 'widow rule');
assert(rules2.some(r => r.field === 'stateDomicile'), 'CG domicile rule');

// Benefit extraction
const b1 = extractBenefitAmount('Rs. 1000 per month financial assistance');
assert(b1.amount === 1000, 'amount extraction');
assert(b1.frequency === 'monthly', 'frequency extraction');
assert(b1.annualValue === 12000, 'annual value');

const b2 = extractBenefitAmount('One-time grant of ₹5,000');
assert(b2.amount === 5000, 'one-time amount');

// myScheme extractor
const extracted = extractMySchemeRendered({
  url: 'https://www.myscheme.gov.in/schemes/pmmvy',
  text: 'Pradhan Mantri Matru Vandana Yojana\nBenefits: Rs. 5000 cash incentive for pregnant women\nEligibility: Pregnant and lactating mothers with bank account\nHow to Apply: Visit nearest Anganwadi centre\nDocuments Required: Aadhaar Card, MCP Card, Bank Passbook',
  html: '<title>PMMVY - myScheme</title>',
  title: 'PMMVY - myScheme',
});
assert(extracted !== null, 'myScheme extraction works');
assert(extracted?.womenFocused === true, 'women focused detected');
assert(extracted?.benefitSummary?.includes('5000'), 'benefit extracted');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
