const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['main.js', 'preload.js', 'bin/whipwhip.js'];

for (const relativePath of sourceFiles) {
  const absolutePath = path.join(root, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');
  new vm.Script(source, { filename: relativePath });
}

const overlay = fs.readFileSync(path.join(root, 'overlay.html'), 'utf8');
const mainSource = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const preloadSource = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
const scriptStart = overlay.indexOf('<script>');
const scriptEnd = overlay.lastIndexOf('</script>');

if (scriptStart < 0 || scriptEnd <= scriptStart) {
  throw new Error('overlay.html must contain a script block');
}

new vm.Script(overlay.slice(scriptStart + '<script>'.length, scriptEnd), {
  filename: 'overlay.html:inline-script',
});

const requiredSafetyContracts = [
  [overlay, 'id="soundEnabled" type="checkbox"', 'sound checkbox'],
  [overlay, 'id="macroEnabled" type="checkbox"', 'keyboard automation checkbox'],
  [overlay, "stored === null ? true : stored === 'true'", 'sound-on default'],
  [mainSource, 'let macroEnabled = false;', 'main-process automation-off default'],
  [mainSource, 'if (!macroEnabled) return;', 'main-process crack automation gate'],
  [preloadSource, "ipcRenderer.send('set-macro-enabled'", 'restricted automation IPC bridge'],
];

for (const [source, fragment, label] of requiredSafetyContracts) {
  if (!source.includes(fragment)) throw new Error(`Missing production contract: ${label}`);
}

const requiredAssets = [
  'icon/icon.ico',
  'icon/AppIcon.icns',
  'icon/Template.png',
  'sounds/A.mp3',
  'sounds/B.mp3',
  'sounds/C.mp3',
  'sounds/D.mp3',
  'sounds/E.mp3',
];

for (const relativePath of requiredAssets) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Missing required production asset: ${relativePath}`);
  }
}

console.log('WhipWhip source and production assets are valid.');
