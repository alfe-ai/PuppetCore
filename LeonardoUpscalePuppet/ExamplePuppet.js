/* 
  ExamplePuppet.js replicates the logic from run.sh using Node.js.
  It checks for the ensure_chromium_installed.sh helper, then runs index.js
  with all CLI arguments, capturing and displaying logs in real-time.
*/

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
  // Resolve current script directory
  const SCRIPT_DIR = path.resolve(__dirname);
  const possiblePaths = [
    path.join(SCRIPT_DIR, '../node_modules/puppetcore/scripts/ensure_chromium_installed.sh'),
    path.join(SCRIPT_DIR, '../node_modules/puppetcore/dist/scripts/ensure_chromium_installed.sh'),
    path.join(SCRIPT_DIR, '../node_modules/.bin/ensure_chromium_installed.sh')
  ];

  let helper = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      helper = p;
      break;
    }
  }

  if (helper) {
    console.log(`[ExamplePuppet.js] Using helper: ${helper}`);
    await new Promise((resolve) => {
      const runHelper = spawn('bash', [helper], { stdio: 'inherit' });
      runHelper.on('close', resolve);
    });
  } else {
    console.log('[ExamplePuppet.js] ⚠  Could not find ensure_chromium_installed.sh – assuming Chromium is already present.');
  }

  // Launch index.js with streaming output
  const nodeProcess = spawn('node', [path.join(SCRIPT_DIR, 'index.js'), ...process.argv.slice(2)]);

  // Capture stdout/stderr
  const outputFile = path.join(SCRIPT_DIR, 'output.txt');
  const writeStream = fs.createWriteStream(outputFile, { flags: 'w' });

  nodeProcess.stdout.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    writeStream.write(text);
  });

  nodeProcess.stderr.on('data', (data) => {
    const text = data.toString();
    process.stderr.write(text);
    writeStream.write(text);
  });

  nodeProcess.on('close', (code) => {
    console.log(`[ExamplePuppet.js] index.js exited with code ${code}`);
    writeStream.end();
  });
})();
