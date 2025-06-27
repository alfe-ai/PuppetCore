const fs   = require('fs');
const ini  = require('ini');
const path = require('path');

function loadConfig() {
    console.log('loadConfig(): Loading config…');

    const configPath = path.resolve(__dirname, 'config.ini');
    console.log('loadConfig(): config path =', configPath);
    const parsed     = ini.parse(fs.readFileSync(configPath, 'utf-8'));

    /* Flatten [DEFAULT] so callers can use config.key directly */
    if (parsed.DEFAULT) {
        Object.assign(parsed, parsed.DEFAULT);
        delete parsed.DEFAULT;
    }

    return parsed;
}

module.exports = loadConfig;
