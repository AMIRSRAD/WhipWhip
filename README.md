# WhipWhip

<p align="center">
  <img src="icon/app-icon.png" alt="WhipWhip neon whip icon" width="180">
</p>

WhipWhip is an interactive desktop armory built with Electron. Pick a weapon,
choose its color, and swing it with your mouse across a transparent full-screen
overlay. A sufficiently fast crack plays a sound and sends a configurable
keyboard action to the previously active application.

## Weapons

- **Classic Whip** — balanced motion and a clean colored leather stroke.
- **Chain Flail** — heavier physics, individual metal links, and a spiked tip.
- **Plasma Lash** — faster movement with layered neon energy and bloom.
- **Firebrand** — a hot gradient, flame glow, and animated embers.
- **Bullwhip** — a long professional leather taper tuned for precise cracks.
- **Rope Dart** — a flexible cord with a distinctive steel point.
- **Steel Cable** — short, stiff industrial movement with reinforced nodes.
- **Ribbon Blade** — broad metallic rendering with light, flowing physics.

Every weapon supports seven restrained color presets and a custom color picker.
Slate is the professional default. WhipWhip stores the last equipped weapon and
color locally in Electron's application data.

## Install on Windows

[Download the latest release](https://github.com/AMIRSRAD/WhipWhip/releases/latest),
then choose either artifact:

- **NSIS installer** — a normal current-user installation with Start Menu and
  optional desktop shortcuts.
- **Portable executable** — runs without installation or administrator access.

The initial release is unsigned, so Windows may show a Microsoft Defender
SmartScreen warning. Code-signing support is already wired for future releases.

## Run from source

Use Node.js 20 or newer.

```powershell
npm ci
npm start
```

`npm run dev` launches directly into the armory. Windows x64 is the currently
validated production target. macOS and Linux automation exists in source, but
release installers for those platforms have not yet been validated. Linux
keyboard automation requires `xdotool`.

## Controls

1. Launch WhipWhip to open the selector. Starting it again reuses the existing
   process and brings the selector back—only one instance can run.
2. Choose a weapon and color. Crack audio is on by default and can be disabled
   independently. Keyboard automation is off by default; enable it only if you
   want crack messages typed for you.
3. Select **Equip**.
4. Move the mouse sharply to crack the weapon.
5. Left-click anywhere to drop it with animation.
6. Right-click anywhere to dismiss it immediately.
7. Left-click the tray icon to restore the saved whip directly.
8. Right-click the tray icon for **Show whip**, **Change settings**, and **Quit**.

The transparent overlay follows the complete Windows virtual desktop. Display
changes and DPI changes are detected while the app is running, and the selector
opens on the monitor containing the pointer.

## What the crack does

When keyboard automation is enabled, a detected crack sends `Ctrl+C`, types a
randomly selected encouragement, and presses Enter. On Windows this uses
`user32.dll` through Koffi, so the keystrokes are real and are sent to whichever
application has focus. The setting is disabled by default and remembered locally.
Crack audio has its own remembered checkbox and is enabled by default.

Be careful around terminals or editors with unsaved work: `Ctrl+C` interrupts
the foreground process. WhipWhip does not connect to Claude, use an AI API, send
telemetry, or mine cryptocurrency.

## Architecture

- `main.js` owns the tray, transparent overlay, focus handoff, and OS macros.
- `preload.js` exposes the narrow IPC bridge used by the UI.
- `overlay.html` contains the armory, responsive Verlet physics, weapon renderers,
  particles, crack detection, multi-display layout, and local selection persistence.
- `bin/whipwhip.js` starts the desktop app when installed as a CLI package.

The renderer is sandboxed and context-isolated, has no Node.js integration, and
cannot navigate or make network connections. WhipWhip keeps equipment settings
and diagnostic logs locally and has no telemetry.

## Build Windows installers

```powershell
npm ci
npm run check
npm run dist:win
```

The installer and portable executable are created under `release/`. See
[`docs/RELEASING.md`](docs/RELEASING.md) for signing, tagging, checksums, and the
automated GitHub release flow.

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Report
vulnerabilities privately using the process in [`SECURITY.md`](SECURITY.md).

WhipWhip is released under the [MIT license](LICENSE).

## Acknowledgements

WhipWhip began as a production-focused expansion of
[OpenWhip](https://github.com/GitFrog1111/OpenWhip). Its Git history is retained
and the application remains MIT licensed.
