const { connect } = require('puppeteer-real-browser');
const fs          = require('fs');
const path        = require('path');
const loadConfig  = require('./config');

const config = loadConfig();

let page = null;

async function puppeteerSetup() {
    /* Ensure chromePath environment variable */
    if (config.chromePath) {
        process.env.CHROME_PATH = config.chromePath;
    }

    /* Resolve persistent user‑data directory */
    const defaultDir  = path.resolve(__dirname, '../../chrome-profile');
    const userDataDir = config.userDataDir
        ? path.resolve(config.userDataDir)
        : defaultDir;

    /* Create directory if missing */
    fs.mkdirSync(userDataDir, { recursive: true });

    const { browser, page: localPage } = await connect({
        headless: false,
        args: ['--window-size=1920,700'],
        customConfig: {
            userDataDir,
            chromePath: config.chromePath
        },
        turnstile: true,
        connectOption: {},
        disableXvfb: true,
        ignoreAllFlags: false
    });

    page = localPage;
    await page.setViewport({ width: 1920, height: 780 });
    return page;
}

module.exports = puppeteerSetup;
