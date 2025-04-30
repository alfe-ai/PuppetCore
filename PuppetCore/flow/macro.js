const { emptyLog } = require("./logging");
const {
    addTextToChat,
    backspaceInput,
    clickChatOptionsButton,
    clickRenameButton,
    pressEnter,
    sendChatMessage,
    typeInput,
    waitForChatOptionsButton,
    waitForChatTitle,
    waitForPromptTextarea,
    waitForPromptTextareaClear,
    waitForRenameButton,
    waitForURLChange,
    setGlobalPage,
    sleep_helper,
    clickArchiveButton
} = require("./puppet_helpers");

async function loadChatGPT(page, addText = true, url = null) {
    setGlobalPage(page);

    if (!url) {
        // Open a new chat
        await newChat();
        console.log('New chat opened.');
    } else {
        await page.goto(url);
        console.log('Chat loaded from URL.');
    }

    // Wait for the new chat button to load
    await waitForNewChatButton();
    console.log('New chat button loaded.');

    // Wait for the prompt textarea to load
    await waitForPromptTextarea();
    console.log('Prompt textarea loaded.');

    if (addText) {
        // Add text to the chat
        await addTextToChat('Hello, I am a whimsical puppet!');
        console.log('Text added to chat. (preliminary)');

        // Wait for the prompt textarea to clear
        await waitForPromptTextareaClear();
        console.log('Prompt textarea cleared.');
    }

    if (!url) {
        // Wait for the chat title to load
        await waitForChatTitle();
        console.log('Chat title loaded.');
    }
}

async function loadURL(page, url) {
    setGlobalPage(page);

    await page.goto(url);
    console.log('Loaded URL: ' + url);
}

async function addInput(inputText) {
    // Add text to the chat
    await addTextToChat(inputText);
    console.log('Text added to chat. (actual)');

    await sleep(3);
}

const sleep = sleep_helper;

async function sendInput() {
    // Send Chat Message
    await sendChatMessage();
    console.log('Chat message sent.');
}

async function waitToGetChatURL(originalURL) {
    // Wait for the chat options button to load
    console.log('Waiting for chat options button...');
    await waitForChatOptionsButton();
    console.log('Chat options button loaded.');

    let newURL = await waitForURLChange(originalURL);
    console.log('New URL: ' + newURL);

    return newURL;
}

async function renameChat(gitRepoName, chatNumber) {
    // Rename Chat
    console.log('Clicking chat \'...\' button to rename...');
    await clickChatOptionsButton();
    console.log('Chat \'...\' button clicked.');

    // Wait for the rename button to load
    console.log('Waiting for rename button...');
    await waitForRenameButton();
    console.log('Rename button loaded.');

    // Sleep 5
    await sleep(5);

    // Click the rename button
    console.log('Clicking rename button...');
    await clickRenameButton();
    console.log('Rename button clicked.');

    // Sleep 2
    await sleep(2);

    // Backspace input
    for (let i = 0; i < 10; i++) {
        await backspaceInput();
        console.log('Backspace input.');
        await sleep(0.2);
    }

    // Rename now
    console.log('Renaming chat...');
    await typeInput(`${gitRepoName}: ${chatNumber}`);
    await pressEnter();
    console.log('Renamed chat.');
}

async function archiveAChat(gitRepoName, chatNumber) {
    console.log('Clicking chat \'...\' button to archive...');
    await clickChatOptionsButton();
    console.log('Chat \'...\' button clicked.');

    // Click the archive button
    console.log('Clicking archive button...');
    await clickArchiveButton();
    console.log('Archive button clicked.');

    await sleep(2);
}

function logSection(text) {
    emptyLog('-------------------------------------');
    console.log(text);
    emptyLog('-------------------------------------');
}

// This function is referenced but not defined above, adding for completeness:
async function newChat() {
    // No-Op or add your own code to open a new chat
    console.log('newChat() called (placeholder)');
}

async function waitForNewChatButton() {
    // Placeholder function to simulate waiting for a "New chat" button
    await sleep(1);
}

module.exports = {
    loadChatGPT,
    addInput,
    sendInput,
    waitToGetChatURL,
    renameChat,
    logSection,
    archiveAChat,
    loadURL
};
