const { connect } = require('puppeteer-real-browser');
const fs          = require('fs');
const path        = require('path');
const loadConfig  = require('./config');

const config = loadConfig();

let page = null;

async function puppeteerSetup(opts = {}) {
    const verbose = opts.verbose !== undefined ? opts.verbose : true;
    if (verbose) {
        console.log('[puppeteerSetup] starting with opts:', JSON.stringify(opts));
    }

    /* Ensure chromePath environment variable */
    if (config.chromePath) {
        process.env.CHROME_PATH = config.chromePath;
    }
    if (verbose) {
        console.log('[puppeteerSetup] CHROME_PATH env:', process.env.CHROME_PATH || 'not set');
    }

    /* Resolve persistent user‑data directory */
    const defaultDir  = path.resolve(__dirname, '../../chrome-profile');
    const userDataDir = config.userDataDir
        ? path.resolve(config.userDataDir)
        : defaultDir;
    if (verbose) {
        console.log('[puppeteerSetup] Using userDataDir:', userDataDir);
    }

    /* Create directory if missing */
    fs.mkdirSync(userDataDir, { recursive: true });

    const connectOpts = {
        headless: false,
        args: [
            '--window-size=1920,700',
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        customConfig: {
            userDataDir,
            chromePath: config.chromePath
        },
        turnstile: true,
        connectOption: {},
        disableXvfb: true,
        ignoreAllFlags: false
    };
    if (verbose) {
        console.log('[puppeteerSetup] connect() options:', JSON.stringify(connectOpts, null, 2));
    }

    const { browser, page: localPage } = await connect(connectOpts);
    if (verbose) {
        console.log('[puppeteerSetup] browser launched');
    }

    page = localPage;
    await page.setViewport({ width: 1920, height: 780 });
    if (verbose) {
        console.log('[puppeteerSetup] viewport set and page ready');
    }
    return page;
}

module.exports = puppeteerSetup;
