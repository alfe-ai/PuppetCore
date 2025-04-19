function emptyLog(text) {
    let blankStart = '                           ';
    originalLog(blankStart + text);
}

// Overwriting console.log to add timestamps
const originalLog = console.log;
const newConsoleLog = function (message, ...optionalParams) {
    const timestamp = new Date().toISOString();  // Get ISO timestamp with milliseconds
    originalLog(`[${timestamp}]`, message, ...optionalParams);
};

console.log = newConsoleLog;

module.exports = { emptyLog, originalLog, newConsoleLog };
