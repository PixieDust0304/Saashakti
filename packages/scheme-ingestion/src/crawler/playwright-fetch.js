
/**
 * Playwright-based page fetcher for JS-rendered SPAs
 * Used for myScheme.gov.in and other Next.js/React sites
 */

let browser = null;

export async function launchBrowser() {
  if (browser) return browser;
  const { chromium } = await import('playwright');
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  console.log('[playwright] Browser launched');
  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    console.log('[playwright] Browser closed');
  }
}

/**
 * Fetch a JS-rendered page using Playwright
 * Waits for content to load, then extracts text and HTML
 */
export async function fetchRenderedPage(url, options = {}) {
  const {
    waitFor = 'networkidle',
    timeout = 30000,
    waitForSelector = null,
  } = options;

  const b = await launchBrowser();
  const context = await b.newContext({
    userAgent: 'SaashaktiSchemeIngestion/0.2 (Government Welfare Platform)',
    locale: 'en-IN',
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: waitFor, timeout });
    
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {});
    }

    // Wait a bit more for dynamic content
    await page.waitForTimeout(2000);

    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText || '');
    const title = await page.title();

    return {
      url,
      ok: true,
      status: 200,
      contentType: 'text/html',
      html,
      text,
      title,
      rendered: true,
    };
  } catch (err) {
    return {
      url,
      ok: false,
      status: 0,
      contentType: '',
      html: '',
      text: '',
      title: '',
      rendered: true,
      error: err.message,
    };
  } finally {
    await context.close();
  }
}

/**
 * Batch fetch multiple pages with rate limiting
 */
export async function fetchRenderedPages(urls, options = {}) {
  const { concurrency = 2, delayMs = 2000 } = options;
  const results = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => fetchRenderedPage(url, options))
    );
    results.push(...batchResults);
    
    if (i + concurrency < urls.length) {
      console.log(`[playwright] Fetched ${results.length}/${urls.length}, pausing ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}
