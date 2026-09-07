# Publishing guide

How to package and publish **Office Viewer Enhance** (`maizhuoying.vscode-office-enhance`) to the VS Code Marketplace, and optionally to Open VSX.

> If telemetry is ever re-enabled, also read [telemetry.md](telemetry.md) (deprecated/archived).

## 1. Create the publisher

1. Sign in at the [Marketplace management portal](https://marketplace.visualstudio.com/manage) with a Microsoft account.
2. Create a publisher with the ID **`maizhuoying`** — it must match `"publisher"` in `package.json` exactly.
3. The extension ID then becomes `maizhuoying.vscode-office-enhance`.

## 2. Create a Personal Access Token (PAT)

1. Sign in to [Azure DevOps](https://dev.azure.com) → user icon (top right) → **Personal Access Tokens**
2. **New Token**:
   - Organization: **All accessible organizations**
   - Scopes: **Custom defined → Marketplace → Manage**
3. Copy the token — it is shown **only once**. Default lifetime is 30 days; recreate and re-login after expiry.

## 3. Package and verify locally

```bash
npm run lint:fix     # keep the codebase clean
npm run build        # production build (desktop + web extension + webview + vditor)
npm run package      # produces vscode-office-enhance-<version>.vsix
```

Before publishing, install the `.vsix` locally (Extensions view → `···` → **Install from VSIX...**) and smoke-test the main viewers (`.xlsx` with formulas, `.pdf`, `.md`, `.zip`).

> `--no-dependencies` is already part of the npm scripts: it skips vsce's node_modules integrity check, which does not work with pnpm installs.

## 4. Login and publish

```bash
npx vsce login maizhuoying     # paste the PAT when prompted
npx vsce publish --no-dependencies
```

The `vscode:prepublish` hook runs `npm run build` automatically before packing.

A few minutes after publishing, the listing appears at:
`https://marketplace.visualstudio.com/items?itemName=maizhuoying.vscode-office-enhance`

## 5. Versioning

- Every publish must use a version **higher** than the one currently on the Marketplace.
- Let vsce bump it automatically (also commits and tags):
  - `npx vsce publish --no-dependencies` → patch
  - `npx vsce publish --no-dependencies minor` / `major`
- Or set `"version"` in `package.json` yourself and run `npx vsce publish --no-dependencies <version>`.

## 6. Publish to Open VSX (optional)

Open VSX is the registry used by VSCodium and other VS Code forks.

1. Sign in at [open-vsx.org](https://open-vsx.org) with a GitHub account
2. Settings → **Access Tokens** → generate a token
3. Publish the `.vsix` produced above:

```bash
npx ovsx publish vscode-office-enhance-<version>.vsix -p <token>
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `401` / auth error on publish | PAT expired or wrong scope — recreate with **Marketplace → Manage**, then `npx vsce login maizhuoying` again |
| Version rejected | That version already exists on the Marketplace — bump `version` |
| Publish-time build fails | Run `npm run build` locally first and fix the errors |
| Publisher mismatch | `"publisher"` in `package.json` must exactly equal your Marketplace publisher ID |
| Broken images in the marketplace README | Make sure files referenced by README (e.g. `image/...`) exist in the repo |
| Coexisting with the upstream extension | This fork uses `maizhuoying.*` viewTypes, so both extensions can be installed side by side; VS Code asks which editor to use per file type |

## Related docs

- [telemetry.md](telemetry.md) — deprecated telemetry setup (archived)
