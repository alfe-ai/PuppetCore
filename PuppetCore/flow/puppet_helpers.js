/* PuppetCore – common flow helpers */

'use strict';

const { setTimeout: sleep } = require('timers/promises');

/* ------------------------------------------------------------------ */
/*  Simple sleep / wait helper                                        */
/* ------------------------------------------------------------------ */

/**
 * Pause execution for the given number of **seconds**.
 * @param {number} seconds
 */
async function sleep_helper(seconds = 1) {
  await sleep(seconds * 1000);
}

/* ------------------------------------------------------------------ */
/*  Page handle management                                            */
/* ------------------------------------------------------------------ */

let _page = null;

/**
 * Store the Puppeteer `Page` so helpers can act on it globally.
 * Call this right after `puppeteerSetup()`:
 *
 * ```js
 * const page = await puppeteerSetup();
 * setGlobalPage(page);
 * ```
 *
 * @param {import('puppeteer-core').Page} page
 */
function setGlobalPage(page) {
  _page = page;
}

/* ------------------------------------------------------------------ */
/*  clickText helper                                                  */
/* ------------------------------------------------------------------ */

/**
 * Click the first element whose *visible* text contains `text`.
 *
 * ```js
 * await clickText('Submit');
 * ```
 *
 * - Search is **case-insensitive**.
 * - Waits up to `opts.timeout` ms (default 10 000 ms) for the element.
 *
 * @param {string} text                         The text to look for
 * @param {{page?: import('puppeteer-core').Page,
 *          timeout?: number}}        [opts]    Optional overrides
 */
async function clickText(text, opts = {}) {
  const page    = opts.page    ?? _page;
  const timeout = opts.timeout ?? 10_000;
  const debug   = opts.debug ?? true;

  if (!page) {
    throw new Error(
      'clickText(): no Page instance available – call setGlobalPage(page) first or pass {page}'
    );
  }

  const lowered = text.replace(/\s+/g, ' ').trim().toLowerCase();
  if (debug) {
    console.log(`[clickText] Searching for "${text}" (normalized: "${lowered}") with timeout ${timeout}ms`);
  }

  // Look for any element whose visible text contains the needle.
  // If the match is inside a non-clickable element (e.g. a <span>
  // inside a button), return the closest clickable ancestor so the
  // final click actually triggers the intended action.
  const handle = await page.waitForFunction(
    t => {
      function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (
          style &&
          (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')
        ) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function findClickable(el) {
        while (el) {
          if (
            el.tagName === 'BUTTON' ||
            el.tagName === 'A' ||
            el.hasAttribute('onclick') ||
            el.getAttribute('role') === 'button'
          ) {
            return el;
          }
          el = el.parentElement;
        }
        return null;
      }

      const clickables = document.querySelectorAll('button, a, [role="button"], [onclick]');
      for (const el of clickables) {
        if (!isVisible(el)) continue;
        const visibleText = el.innerText || el.textContent || '';
        const cleaned = visibleText.replace(/\s+/g, ' ').trim().toLowerCase();
        if (cleaned.includes(t)) {
          el.scrollIntoView({ block: 'center' });
          return el;
        }
      }

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let node;
      while ((node = walker.nextNode())) {
        if (!isVisible(node)) continue;
        const visibleText = node.innerText || node.textContent || '';
        const cleaned = visibleText.replace(/\s+/g, ' ').trim().toLowerCase();
        if (cleaned.includes(t)) {
          const clickable = findClickable(node) || node;
          clickable.scrollIntoView({ block: 'center' });
          return clickable;
        }
      }
      return null;
    },
    { timeout },
    lowered
  );

  const el = await handle.asElement();
  if (!el) {
    throw new Error(`clickText(): no element found for text "${text}"`);
  }

  if (debug) {
    const info = await el.evaluate(element => {
      function path(el) {
        const parts = [];
        while (el) {
          const name = el.tagName.toLowerCase();
          const id = el.id ? '#' + el.id : '';
          parts.unshift(name + id);
          el = el.parentElement;
        }
        return parts.join('>');
      }
      return {
        tag: element.tagName,
        text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
        path: path(element),
      };
    });
    console.log(`[clickText] Found <${info.tag}> with text "${info.text}" at ${info.path}`);
  }

  await el.evaluate(element => element.scrollIntoView({ block: 'center' }));
  if (debug) {
    console.log('[clickText] Waiting 1 second after scroll');
  }
  await sleep(1000);
  await el.click();
}

/* ------------------------------------------------------------------ */
/*  clickName helper                                                  */
/* ------------------------------------------------------------------ */

/**
 * Click the first element whose `name` attribute matches the provided value.
 *
 * ```js
 * await clickName('clear');
 * ```
 *
 * - Waits up to `opts.timeout` ms (default 10 000 ms) for the element.
 *
 * @param {string} name                         The name attribute to look for
 * @param {{page?: import('puppeteer-core').Page,
 *          timeout?: number}}        [opts]    Optional overrides
 */
async function clickName(name, opts = {}) {
  const page    = opts.page    ?? _page;
  const timeout = opts.timeout ?? 10_000;
  const debug   = opts.debug ?? true;

  if (!page) {
    throw new Error(
      'clickName(): no Page instance available – call setGlobalPage(page) first or pass {page}'
    );
  }

  const selector = `[name="${name}"]`;
  if (debug) {
    console.log(`[clickName] Searching for ${selector} with timeout ${timeout}ms`);
  }

  const el = await page.waitForSelector(selector, { timeout });
  if (!el) {
    throw new Error(`clickName(): no element found with name "${name}"`);
  }

  await el.evaluate(element => element.scrollIntoView({ block: 'center' }));
  if (debug) {
    console.log('[clickName] Waiting 1 second after scroll');
  }
  await sleep(1000);
  try {
    await el.click();
  } catch (err) {
    if (debug) {
      console.log(`[clickName] Standard click failed: ${err.message}. Trying DOM click`);
    }
    await page.evaluate(element => element.click(), el);
  }
}

/* ------------------------------------------------------------------ */
/*  clickNth helper                                                   */
/* ------------------------------------------------------------------ */

/**
 * Click the nth element matching the given CSS selector.
 *
 * ```js
 * await clickNth('.view-type-card', 2);
 * ```
 *
 * - The `index` is 1-based (1 = first element).
 * - Waits up to `opts.timeout` ms (default 10 000 ms) for the element.
 *
 * @param {string} selector                     CSS selector for the elements
 * @param {number} [index=1]                    1-based index of the element
 * @param {{page?: import('puppeteer-core').Page,
 *          timeout?: number}}        [opts]    Optional overrides
 */
async function clickNth(selector, index = 1, opts = {}) {
  const page    = opts.page    ?? _page;
  const timeout = opts.timeout ?? 10_000;
  const debug   = opts.debug ?? true;

  if (!page) {
    throw new Error(
      'clickNth(): no Page instance available – call setGlobalPage(page) first or pass {page}'
    );
  }

  const idx0 = Math.max(1, Number(index)) - 1;
  if (debug) {
    console.log(`[clickNth] Searching for ${selector} index ${index} with timeout ${timeout}ms`);
  }

  await page.waitForFunction(
    (sel, i) => document.querySelectorAll(sel).length > i,
    { timeout },
    selector,
    idx0
  );

  const elements = await page.$$(selector);
  const el = elements[idx0];
  if (!el) {
    throw new Error(`clickNth(): no element found for selector "${selector}" at index ${index}`);
  }

  await el.evaluate(element => element.scrollIntoView({ block: 'center' }));
  if (debug) {
    console.log('[clickNth] Waiting 1 second after scroll');
  }
  await sleep(1000);
  try {
    await el.click();
  } catch (err) {
    if (debug) {
      console.log(`[clickNth] Standard click failed: ${err.message}. Trying DOM click`);
    }
    await page.evaluate(element => element.click(), el);
  }
}

/* ------------------------------------------------------------------ */
/*  clickTextCheckbox helper                                           */
/* ------------------------------------------------------------------ */

/**
 * Click a checkbox associated with the element whose *visible* text contains `text`.
 *
 * ```js
 * await clickTextCheckbox('Display free shipping');
 * ```
 *
 * - Search is **case-insensitive**.
 * - Waits up to `opts.timeout` ms (default 10 000 ms) for the checkbox.
 *
 * @param {string} text                         The text to look for
 * @param {{page?: import('puppeteer-core').Page,
 *          timeout?: number}}        [opts]    Optional overrides
 */
async function clickTextCheckbox(text, opts = {}) {
  const page    = opts.page    ?? _page;
  const timeout = opts.timeout ?? 10_000;
  const debug   = opts.debug ?? true;

  if (!page) {
    throw new Error(
      'clickTextCheckbox(): no Page instance available – call setGlobalPage(page) first or pass {page}'
    );
  }

  const lowered = text.replace(/\s+/g, ' ').trim().toLowerCase();
  if (debug) {
    console.log(`[clickTextCheckbox] Searching for "${text}" (normalized: "${lowered}") with timeout ${timeout}ms`);
  }

  const handle = await page.waitForFunction(
    t => {
      function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (
          style &&
          (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')
        ) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let node;
      while ((node = walker.nextNode())) {
        if (!isVisible(node)) continue;
        const visibleText = node.innerText || node.textContent || '';
        const cleaned = visibleText.replace(/\s+/g, ' ').trim().toLowerCase();
        if (cleaned.includes(t)) {
          let checkbox = null;
          const label = node.closest('label');
          if (label) {
            checkbox = label.querySelector('input[type="checkbox"]');
          }
          if (!checkbox) {
            checkbox = node.querySelector('input[type="checkbox"]');
          }
          if (checkbox) {
            checkbox.scrollIntoView({ block: 'center' });
            return checkbox;
          }
        }
      }
      return null;
    },
    { timeout },
    lowered
  );

  const el = await handle.asElement();
  if (!el) {
    throw new Error(`clickTextCheckbox(): no checkbox found for text "${text}"`);
  }

  await el.evaluate(element => element.scrollIntoView({ block: 'center' }));
  if (debug) {
    console.log('[clickTextCheckbox] Waiting 1 second after scroll');
  }
  await sleep(1000);
  try {
    await el.click();
  } catch (err) {
    if (debug) {
      console.log(`[clickTextCheckbox] Standard click failed: ${err.message}. Trying DOM click`);
    }
    await page.evaluate(element => element.click(), el);
  }
}

/* ------------------------------------------------------------------ */
/*  clickNthName helper                                               */
/* ------------------------------------------------------------------ */

/**
 * Click the nth element whose `name` attribute matches the provided value.
 *
 * ```js
 * await clickNthName('option', 2);
 * ```
 *
 * - The `index` is 1-based (1 = first element).
 * - Waits up to `opts.timeout` ms (default 10 000 ms) for the element.
 *
 * @param {string} name                         The name attribute to look for
 * @param {number} [index=1]                    1-based index of the element
 * @param {{page?: import('puppeteer-core').Page,
 *          timeout?: number}}        [opts]    Optional overrides
 */
async function clickNthName(name, index = 1, opts = {}) {
  const selector = `[name="${name}"]`;
  await clickNth(selector, index, opts);
}

/* ------------------------------------------------------------------ */
/*  Exports                                                           */
/* ------------------------------------------------------------------ */

module.exports = {
  // existing utilities
  sleep_helper,

  // new helpers
  setGlobalPage,
  clickText,
  clickName,
  clickNth,
  clickNthName,
  clickTextCheckbox,
};
