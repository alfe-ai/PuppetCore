let page = null;

function setGlobalPage(globalPage) {
    page = globalPage;
}

async function sleep_helper(seconds) {
    const ms = seconds * 1000;
    const verbose = seconds >= 1;

    if (verbose) console.log(`Waiting for ${seconds} s …`);
    await new Promise(r => setTimeout(r, ms));
    if (verbose) console.log('… done.');
}

async function waitForURLChange(originalURL) {
    const oldURL = originalURL || page.url();

    console.log('Waiting for URL change …');
    await page.waitForFunction(`window.location.href !== '${oldURL}'`);

    const newURL = page.url();
    console.log('===============');
    console.log(`URL changed from\n${oldURL}\n→\n${newURL}`);
    console.log('===============');

    return newURL;
}

async function backspaceInput() {
    await page.keyboard.press('Backspace');
}

async function typeInput(text) {
    await page.keyboard.type(text);
}

async function pressEnter() {
    await page.keyboard.press('Enter');
}

module.exports = {
    setGlobalPage,
    sleep_helper,
    waitForURLChange,
    backspaceInput,
    typeInput,
    pressEnter
};
