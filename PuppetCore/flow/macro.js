const { emptyLog } = require("./logging");
const { setGlobalPage, sleep_helper } = require("./puppet_helpers");

async function loadURL(page, url) {
    setGlobalPage(page);

    await page.goto(url);
    console.log('Loaded URL: ' + url);
}

const sleep = sleep_helper;

function logSection(text) {
    emptyLog('-------------------------------------');
    console.log(text);
    emptyLog('-------------------------------------');
}

module.exports = {
    loadURL,
    logSection
};
