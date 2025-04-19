let page = null;

/**
 * Make the current puppeteer Page globally available to helpers.
 */
function setGlobalPage(globalPage) {
    page = globalPage;
}

/**
 * Sleep helper – prints only for waits >= 1 s to avoid console spam.
 * @param {number} seconds  Amount of time to pause
 */
async function sleep_helper(seconds) {
    const ms = seconds * 1000;
    const verbose = seconds >= 1;

    if (verbose) console.log(`Waiting for ${seconds} s …`);
    await new Promise(r => setTimeout(r, ms));
    if (verbose) console.log('… done.');
}

/* ------------------------------------------------------------------ */
/* Frequently used editor/chat helpers – unchanged                    */
/* ------------------------------------------------------------------ */
async function waitForPromptTextarea() {
    await page.waitForSelector('div#prompt-textarea');
}

async function addTextToChat(text) {
    await page.evaluate((text) => {
        document.getElementById('prompt-textarea').innerText = text;
    }, text);
}

async function waitForPromptTextareaClear() {
    await page.waitForFunction(() => {
        return document.getElementById('prompt-textarea').innerText === '';
    });
}

async function waitForChatTitle() {
    await page.waitForSelector('div.text-center.text-2xl.font-semibold');
}

async function sendChatMessage() {
    await page.click('button[aria-label="Send prompt"]');
}

async function waitForChatOptionsButton() {
    await page.waitForSelector('button[data-testid="history-item-0-options"]');
}

async function clickChatOptionsButton() {
    try {
        await page.click('button[data-testid="history-item-0-options"]');
    } catch (e) {
        console.error('Error clicking chat options button: ' + e);
        await page.click('li[data-testid="history-item-0"]');
        console.log('Clicked chat item to focus.');
        await sleep_helper(5);
        await page.click('button[data-testid="history-item-0-options"]');
        console.log('Clicked options button.');
        await sleep_helper(2);
    }
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

async function waitForRenameButton() {
    await page.waitForFunction(() => {
        return document.body.innerText.includes('Rename');
    });
}

async function clickRenameButton() {
    const renameButton = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('div[role="menuitem"]'))
            .find(div => div.textContent.trim() === 'Rename');
    });

    const element = renameButton.asElement();
    if (!element) throw new Error('Rename button not found.');

    await element.scrollIntoViewIfNeeded();
    if (await element.isIntersectingViewport()) {
        await element.click();
    } else {
        throw new Error('Rename button not visible.');
    }
}

async function clickArchiveButton() {
    const archiveButton = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('div[role="menuitem"]'))
            .find(div => div.textContent.trim() === 'Archive');
    });

    const element = archiveButton.asElement();
    if (!element) throw new Error('Archive button not found.');

    await element.scrollIntoViewIfNeeded();
    if (await element.isIntersectingViewport()) {
        await element.click();
    } else {
        throw new Error('Archive button not visible.');
    }
}

/* Keyboard helpers */
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
    waitForPromptTextarea,
    addTextToChat,
    waitForPromptTextareaClear,
    waitForChatTitle,
    sendChatMessage,
    waitForChatOptionsButton,
    clickChatOptionsButton,
    waitForURLChange,
    waitForRenameButton,
    clickRenameButton,
    backspaceInput,
    typeInput,
    pressEnter,
    sleep_helper,
    clickArchiveButton
};
