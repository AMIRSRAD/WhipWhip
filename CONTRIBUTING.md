# Contributing to WhipWhip

Contributions are welcome through focused pull requests.

## Development

1. Install Node.js 20 or newer.
2. Run `npm ci`.
3. Run `npm run dev` to open the armory immediately.
4. Run `npm run check` before committing.
5. Run `npm run dist:dir` for a quick unpacked Windows packaging check.

Keep WhipWhip offline and telemetry-free. New weapons should define clearly
different rendering or physics, respect the selected color, and retain the
existing drop and crack interactions.

Please do not commit generated installers, private certificates, signing keys,
or user-specific application data.
