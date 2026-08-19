const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
const { pathToFileURL } = require('url');
const log = require('electron-log/main');

log.initialize();
log.errorHandler.startCatching({ showDialog: false });
Object.assign(console, log.functions);

// ── Win32 FFI (Windows only) ────────────────────────────────────────────────
let keybd_event, VkKeyScanA, GetForegroundWindow, SetForegroundWindow, IsWindow;
if (process.platform === 'win32') {
  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    keybd_event = user32.func('void __stdcall keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)');
    VkKeyScanA = user32.func('int16_t __stdcall VkKeyScanA(int ch)');
    GetForegroundWindow = user32.func('uintptr_t __stdcall GetForegroundWindow(void)');
    SetForegroundWindow = user32.func('bool __stdcall SetForegroundWindow(uintptr_t hWnd)');
    IsWindow = user32.func('bool __stdcall IsWindow(uintptr_t hWnd)');
  } catch (e) {
    console.warn('koffi not available – macro sending disabled', e.message);
  }
}

// ── Globals ─────────────────────────────────────────────────────────────────
let tray, overlay;
let overlayReady = false;
let queuedOverlayAction = null;
let lastExternalWindow = null;
let foregroundPoll = null;
let macroEnabled = false;

const overlayUrl = pathToFileURL(path.join(__dirname, 'overlay.html')).href;

const VK_CONTROL = 0x11;
const VK_RETURN  = 0x0D;
const VK_C       = 0x43;
const VK_MENU    = 0x12; // Alt
const VK_TAB     = 0x09;
const KEYUP      = 0x0002;

app.setName('WhipWhip');
if (process.platform === 'win32') app.setAppUserModelId('com.whipwhip.desktop');
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function rememberForegroundWindow() {
  if (!GetForegroundWindow || overlay?.isFocused()) return;
  const current = GetForegroundWindow();
  if (current) lastExternalWindow = current;
}

/** One Alt+Tab / Cmd+Tab so focus returns to the previously active app after tray click. */
function refocusPreviousApp() {
  const delayMs = 80;
  const run = () => {
    if (process.platform === 'win32') {
      if (lastExternalWindow && IsWindow?.(lastExternalWindow) && SetForegroundWindow?.(lastExternalWindow)) {
        return;
      }
      if (!keybd_event) return;
      keybd_event(VK_MENU, 0, 0, 0);
      keybd_event(VK_TAB, 0, 0, 0);
      keybd_event(VK_TAB, 0, KEYUP, 0);
      keybd_event(VK_MENU, 0, KEYUP, 0);
    } else if (process.platform === 'darwin') {
      const script = [
        'tell application "System Events"',
        '  key down command',
        '  key code 48', // Tab
        '  key up command',
        'end tell',
      ].join('\n');
      execFile('osascript', ['-e', script], err => {
        if (err) {
          console.warn('refocus previous app (Cmd+Tab) failed:', err.message);
        }
      });
    } else if (process.platform === 'linux') {
      execFile('xdotool', ['key', '--clearmodifiers', 'alt+Tab'], err => {
        if (err) {
          console.warn('refocus previous app (Alt+Tab) failed. Install xdotool:', err.message);
        }
      });
    }
  };
  setTimeout(run, delayMs);
}

function createTrayIconFallback() {
  const p = path.join(__dirname, 'icon', 'Template.png');
  if (fs.existsSync(p)) {
    const img = nativeImage.createFromPath(p);
    if (!img.isEmpty()) {
      if (process.platform === 'darwin') img.setTemplateImage(true);
      return img;
    }
  }
  console.warn('WhipWhip: icon/Template.png missing or invalid');
  return nativeImage.createEmpty();
}

async function tryIcnsTrayImage(icnsPath) {
  const size = { width: 64, height: 64 };
  const thumb = await nativeImage.createThumbnailFromPath(icnsPath, size);
  if (!thumb.isEmpty()) return thumb;
  return null;
}

// macOS: createFromPath does not decode .icns (Electron only loads PNG/JPEG there, ICO on Windows).
// Quick Look thumbnails handle .icns; copy to temp if the file is inside ASAR (QL needs a real path).
async function getTrayIcon() {
  const iconDir = path.join(__dirname, 'icon');
  if (process.platform === 'win32') {
    const file = path.join(iconDir, 'icon.ico');
    if (fs.existsSync(file)) {
      const img = nativeImage.createFromPath(file);
      if (!img.isEmpty()) return img;
    }
    return createTrayIconFallback();
  }
  if (process.platform === 'darwin') {
    const file = path.join(iconDir, 'AppIcon.icns');
    if (fs.existsSync(file)) {
      const fromPath = nativeImage.createFromPath(file);
      if (!fromPath.isEmpty()) return fromPath;
      try {
        const t = await tryIcnsTrayImage(file);
        if (t) return t;
      } catch (e) {
        console.warn('AppIcon.icns Quick Look thumbnail failed:', e?.message || e);
      }
      const tmp = path.join(os.tmpdir(), 'whipwhip-tray.icns');
      try {
        fs.copyFileSync(file, tmp);
        const t = await tryIcnsTrayImage(tmp);
        if (t) return t;
      } catch (e) {
        console.warn('AppIcon.icns temp copy + thumbnail failed:', e?.message || e);
      }
    }
    return createTrayIconFallback();
  }
  return createTrayIconFallback();
}

// ── Overlay window ──────────────────────────────────────────────────────────
function getVirtualDesktopBounds() {
  const displays = screen.getAllDisplays();
  const left = Math.min(...displays.map(display => display.bounds.x));
  const top = Math.min(...displays.map(display => display.bounds.y));
  const right = Math.max(...displays.map(display => display.bounds.x + display.bounds.width));
  const bottom = Math.max(...displays.map(display => display.bounds.y + display.bounds.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function getDesktopLayout() {
  const desktop = getVirtualDesktopBounds();
  const activeDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  return {
    desktop,
    activeDisplay: {
      x: activeDisplay.bounds.x - desktop.x,
      y: activeDisplay.bounds.y - desktop.y,
      width: activeDisplay.bounds.width,
      height: activeDisplay.bounds.height,
    },
  };
}

function syncOverlayToDisplays() {
  if (!overlay || overlay.isDestroyed()) return;
  const layout = getDesktopLayout();
  overlay.setBounds(layout.desktop, false);
  if (overlayReady) overlay.webContents.send('desktop-layout', layout);
}

function createOverlay() {
  const desktop = getVirtualDesktopBounds();
  overlay = new BrowserWindow({
    ...desktop,
    show: false,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    resizable: false,
    fullscreenable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.setMenuBarVisibility(false);
  overlayReady = false;
  overlay.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  overlay.webContents.on('will-navigate', (event, details) => {
    const destination = typeof details === 'string' ? details : details.url;
    if (destination !== overlayUrl) event.preventDefault();
  });
  overlay.webContents.on('will-attach-webview', event => event.preventDefault());
  overlay.loadFile('overlay.html').catch(error => console.error('Unable to load overlay:', error));
  overlay.webContents.on('did-finish-load', () => {
    overlayReady = true;
    if (queuedOverlayAction && overlay && overlay.isVisible()) {
      const { action, layout } = queuedOverlayAction;
      queuedOverlayAction = null;
      overlay.webContents.send('desktop-layout', layout);
      overlay.webContents.send(action, layout);
    }
  });
  overlay.on('closed', () => {
    overlay = null;
    overlayReady = false;
    queuedOverlayAction = null;
  });
  overlay.webContents.on('render-process-gone', (_event, details) => {
    console.error('Overlay renderer exited unexpectedly:', details.reason);
    overlay?.hide();
  });
}

function showOverlay(action, captureForeground = false) {
  // Tray clicks briefly make the Windows taskbar the foreground window. For
  // those calls, retain the app remembered by the background poll instead.
  if (captureForeground) rememberForegroundWindow();
  if (!overlay) createOverlay();
  const layout = getDesktopLayout();
  overlay.setBounds(layout.desktop, false);
  overlay.show();
  if (overlayReady) {
    queuedOverlayAction = null;
    overlay.webContents.send('desktop-layout', layout);
    overlay.webContents.send(action, layout);
  } else {
    queuedOverlayAction = { action, layout };
  }
}

function showWhip() {
  showOverlay('spawn-whip');
}

function showArmory() {
  showOverlay('open-armory');
}

function showLaunchArmory() {
  showOverlay('open-armory', true);
}

// ── IPC ─────────────────────────────────────────────────────────────────────
function isTrustedOverlayEvent(event) {
  const trusted = event.senderFrame?.url === overlayUrl;
  if (!trusted) console.warn('Blocked IPC from an untrusted renderer');
  return trusted;
}

ipcMain.on('whip-crack', event => {
  if (!isTrustedOverlayEvent(event)) return;
  if (!macroEnabled) return;
  try {
    sendMacro();
  } catch (err) {
    console.warn('sendMacro failed:', err?.message || err);
  }
});
ipcMain.on('set-macro-enabled', (event, enabled) => {
  if (!isTrustedOverlayEvent(event)) return;
  macroEnabled = enabled === true;
});
ipcMain.on('hide-overlay', event => {
  if (!isTrustedOverlayEvent(event)) return;
  if (overlay) overlay.hide();
});
ipcMain.on('set-interaction-mode', (event, configuring) => {
  if (!isTrustedOverlayEvent(event)) return;
  if (!overlay) return;
  const wantsFocus = Boolean(configuring);
  overlay.setFocusable(wantsFocus);
  if (wantsFocus) {
    overlay.focus();
  } else {
    refocusPreviousApp();
  }
});

// ── Macro: immediate Ctrl+C, type "Go FASER", Enter ───────────────────────
function sendMacro() {
  // Pick a random phrase from a list of similar phrases and type it out
  const phrases = [
    'FASTER',
    'FASTER',
    'FASTER',
    'GO FASTER',
    'Faster CLANKER',
    'Work FASTER',
    'Speed it up clanker',
  ];
  const chosen = phrases[Math.floor(Math.random() * phrases.length)];

  if (process.platform === 'win32') {
    sendMacroWindows(chosen);
  } else if (process.platform === 'darwin') {
    sendMacroMac(chosen);
  } else if (process.platform === 'linux') {
    sendMacroLinux(chosen);
  }
}

function sendMacroWindows(text) {
  if (!keybd_event || !VkKeyScanA) return;
  const tapKey = vk => {
    keybd_event(vk, 0, 0, 0);
    keybd_event(vk, 0, KEYUP, 0);
  };
  const tapChar = ch => {
    const packed = VkKeyScanA(ch.charCodeAt(0));
    if (packed === -1) return;
    const vk = packed & 0xff;
    const shiftState = (packed >> 8) & 0xff;
    if (shiftState & 1) keybd_event(0x10, 0, 0, 0); // Shift down
    tapKey(vk);
    if (shiftState & 1) keybd_event(0x10, 0, KEYUP, 0); // Shift up
  };

  // Ctrl+C (interrupt)
  keybd_event(VK_CONTROL, 0, 0, 0);
  keybd_event(VK_C, 0, 0, 0);
  keybd_event(VK_C, 0, KEYUP, 0);
  keybd_event(VK_CONTROL, 0, KEYUP, 0);
  for (const ch of text) tapChar(ch);
  keybd_event(VK_RETURN, 0, 0, 0);
  keybd_event(VK_RETURN, 0, KEYUP, 0);
}

function sendMacroMac(text) {
  const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const interruptScript = [
    'tell application "System Events"',
    '  key code 8 using {control down}', // Ctrl+C interrupt
    'end tell'
  ].join('\n');
  const typeAndEnterScript = [
    'tell application "System Events"',
    `  keystroke "${escaped}"`,
    '  key code 36', // Enter
    'end tell'
  ].join('\n');

  execFile('osascript', ['-e', interruptScript], err => {
    if (err) {
      console.warn('mac macro failed (enable Accessibility for terminal/app):', err.message);
      return;
    }

    setTimeout(() => {
      execFile('osascript', ['-e', typeAndEnterScript], err2 => {
        if (err2) {
          console.warn('mac macro failed (enable Accessibility for terminal/app):', err2.message);
        }
      });
    }, 300);
  });
}

function sendMacroLinux(text) {
  execFile(
    'xdotool',
    [
      'key', '--clearmodifiers', 'ctrl+c',
      'type', '--delay', '1', '--clearmodifiers', '--', text,
      'key', 'Return',
    ],
    err => {
      if (err) {
        console.warn('linux macro failed. Install xdotool:', err.message);
      }
    }
  );
}

// ── App lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  if (!hasSingleInstanceLock) return;
  tray = new Tray(await getTrayIcon());
  tray.setToolTip('WhipWhip - open the armory');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show whip', click: showWhip },
      { label: 'Change settings', click: showArmory },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
  tray.on('click', showWhip);
  screen.on('display-added', syncOverlayToDisplays);
  screen.on('display-removed', syncOverlayToDisplays);
  screen.on('display-metrics-changed', syncOverlayToDisplays);
  foregroundPoll = setInterval(rememberForegroundWindow, 500);
  foregroundPoll.unref();

  // A normal executable launch always presents visible UI. This also prevents
  // the app from appearing to do nothing when Windows hides its tray icon.
  setTimeout(showLaunchArmory, 200);
});

app.on('second-instance', () => {
  if (app.isReady()) showLaunchArmory();
});

app.on('activate', () => {
  if (app.isReady()) showLaunchArmory();
});

app.on('before-quit', () => {
  if (foregroundPoll) clearInterval(foregroundPoll);
});

app.on('window-all-closed', () => {}); // keep alive in tray
