# Changelog

All notable changes to WhipWhip are documented here.

## 0.1.5 - 2026-08-19

### Added

- A clearly labeled keyboard-automation checkbox in the selector.
- A separate remembered checkbox for the existing crack sounds, enabled by
  default to preserve prior audio behavior.

### Security

- Crack-triggered `Ctrl+C`, phrase typing, and Enter are now disabled by
  default and enforced by the main process unless the user explicitly opts in.
- The automation preference is stored locally and can be changed from the
  selector at any time.

## 0.1.4 - 2026-08-18

### Fixed

- Restored the original v0.1.2 pointer and whip physics behavior after the
  v0.1.3 motion changes proved less responsive in real use.

### Changed

- The selector ownership line now includes `amirsrad.ir`.

## 0.1.3 - 2026-08-18

### Added

- Bullwhip, Rope Dart, Steel Cable, and Ribbon Blade weapon profiles with
  distinct rendering and physics.
- A subtle AMIRSRAD ownership line beneath the selector controls.

### Fixed

- The transparent overlay now resynchronizes with the full Windows virtual
  desktop when monitors are added, removed, repositioned, or change DPI.
- The selector now opens on the display containing the mouse instead of being
  centered across the combined multi-monitor rectangle.

### Changed

- Replaced the bright default palette with restrained slate, oxblood, saddle,
  brass, forest, steel-blue, and aubergine colors.
- Improved pointer response with smoothed handle tracking, motion-directed aim,
  weighted tips, tighter stretch control, and fixed 60 Hz physics independent
  of monitor refresh rate.

## 0.1.2 - 2026-08-18

### Fixed

- Normal executable launches now open the selector instead of starting silently
  in the tray.
- Starting WhipWhip again now reuses the single running instance and opens its
  selector.

### Changed

- Left-clicking the Windows tray icon restores the saved whip immediately.
- The tray menu now includes **Show whip**, **Change settings**, and **Quit**.
- Right-clicking an active whip dismisses it immediately; left-clicking retains
  the animated drop behavior.

## 0.1.1 - 2026-08-18

### Changed

- Replaced the neon branding with a minimal charcoal, off-white, and muted coral
  whip mark.
- Updated the README image, tray image, Windows executable and installer icon,
  and macOS icon to use the same restrained identity.

## 0.1.0 - 2026-08-18

### Added

- Integrated armory with four weapon styles.
- Seven color presets and a custom color picker.
- Persistent local equipment selection.
- Windows native crack macro, macOS automation, and Linux `xdotool` support.
- Multi-monitor transparent overlay and foreground-window restoration.
- Original WhipWhip application and installer branding.
- NSIS installer and portable Windows packaging.
- CI validation and tag-driven GitHub releases with SHA-256 checksums.

### Security

- Sandboxed, context-isolated renderer with Node.js integration disabled.
- Restricted content policy with no network connectivity.
- IPC sender validation and navigation, popup, and webview blocking.
- Updated Electron runtime with no reported production dependency vulnerabilities.
