# Releasing WhipWhip

## Local Windows artifacts

```powershell
npm ci
npm run check
npm run dist:win
```

Artifacts are written to `release/`:

- `WhipWhip-<version>-x64-setup.exe` is the interactive current-user installer.
- `WhipWhip-<version>-x64-portable.exe` is the no-install portable build.

## Code signing

Unsigned Windows applications can trigger Microsoft Defender SmartScreen. For a
public production release, obtain an Authenticode code-signing certificate and
configure these GitHub repository secrets:

- `WINDOWS_CSC_LINK`: a base64-encoded PFX certificate or a secure certificate URL.
- `WINDOWS_CSC_KEY_PASSWORD`: the PFX password.

Electron Builder automatically signs the executable and installer when these
values are present. Never commit the certificate or password.

## GitHub release

1. Update `package.json` and `CHANGELOG.md` with the same version.
2. Commit and push the release changes.
3. Create and push a matching tag, such as `v0.1.0`.
4. The release workflow validates the tag, builds both Windows artifacts,
   creates SHA-256 checksums, and publishes a GitHub release.

Test the installer, uninstaller, portable build, tray icon, armory, every weapon,
focus restoration, and the macro on a clean Windows virtual machine before
promoting a release as stable.
