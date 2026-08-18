# Changelog

All notable changes to WhipWhip are documented here.

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
