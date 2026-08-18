#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');

let electronBinary;
try {
  electronBinary = require('electron');
} catch (error) {
  console.error('Could not load Electron. Try: npm install -g whipwhip');
  process.exit(1);
}

const appPath = path.resolve(__dirname, '..');
const child = spawn(electronBinary, [appPath], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
});

child.on('error', error => {
  console.error('Failed to start WhipWhip:', error.message);
  process.exit(1);
});

child.unref();
