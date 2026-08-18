# Security policy

## Supported versions

Security fixes are applied to the latest release of WhipWhip.

## Reporting a vulnerability

Please use the repository's **Security → Report a vulnerability** flow instead
of opening a public issue. Include the affected version, operating system,
reproduction steps, and expected impact. Do not include passwords, tokens, or
private user data.

## Security model

WhipWhip is an offline desktop application. The overlay's content policy blocks
network connections, popups, webviews, and navigation. Renderer code runs with
context isolation, sandboxing, and no Node.js integration. IPC messages are
accepted only from the packaged local overlay.

WhipWhip deliberately emits operating-system keyboard input after a crack. The
input goes to the foreground application, so users should treat it like a real
keyboard macro and avoid using it around destructive or privileged prompts.
