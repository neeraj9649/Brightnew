# Hostinger frontend deployment

`.github/workflows/deploy.yml` adapts the SSH/SCP deployment from
`~/servers/mcube/.github/workflows/deploy.yml`. It deploys both frontends on
frontend changes pushed to `main`, or manually from GitHub Actions:

| Frontend | Build command | Uploaded directory | Domain |
| --- | --- | --- | --- |
| BrightP portal | `npm run build` in `BrightP` | `BrightP/build` | `portal.brightwingstravel.in` |
| Next.js travel website | `npm run build` in `Go_Travel_Brightwings/gotur-nextjs-main` | `Go_Travel_Brightwings/gotur-nextjs-main/out` | `brightwingstravel.com` |

The workflow checks out this repository and only builds and deploys the frontends.
The backend is never built, tested, or deployed by this workflow.
Next.js must retain `output: "export"` and `images: { unoptimized: true }`.
BrightP receives an Apache `.htaccess` fallback for client routes if its build
does not already provide one.

## GitHub Actions secrets

Set these under repository Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `SSH_HOST` | Hostinger SSH hostname or IP |
| `SSH_USER` | Hostinger SSH username |
| `SSH_PORT` | SSH port shown in hPanel |
| `SSH_KEY` or `SSH_KEY_B64` | Full private key or its base64 encoding; base64 takes precedence |
| `REACT_APP_API_URL` | Production backend URL used by BrightP |
| `NEXT_PUBLIC_API_URL` | Production backend URL used by the travel site |

By default, the workflow publishes to `~/domains/portal.brightwingstravel.in/public_html`
and `~/domains/brightwingstravel.com/public_html` on the server. Create both
websites in hPanel first. If hPanel uses different document roots, set optional
`PORTAL_DEPLOY_PATH` and `TRAVEL_DEPLOY_PATH` secrets to their absolute paths.
Both destination paths must exist, must be different, and must point to the
corresponding website's document root. Enable SSH access in Hostinger and install
the matching public key there. Frontend API URLs are embedded in the build;
they must be reachable by visitors' browsers.

Optional secrets: `REACT_APP_RESOURCE_URL`, `NEXT_PUBLIC_RESOURCE_URL` (default
`https://resource.brightwingstravel.in`), and `REACT_APP_PORTAL_URL` (default
`https://portal.brightwingstravel.in`).

## Frontend source

`BrightP`, `Go_Travel_Brightwings`, and `backend` are ordinary directories stored
in `https://github.com/neeraj9649/Brightnew`. There are no submodules or nested
Git repositories. Actions uses its built-in token; `SUBMODULE_TOKEN` is not
needed. To deploy frontend changes, commit and push them directly to this
repository's `main` branch.

Uploads land in a separate staging directory for each app and run. Publication
replaces build directories, copies top-level files including dotfiles, and
publishes `index.html` last, following the mcube workflow. Unrelated top-level
files in the document root are retained. A running deployment finishes before
the next run starts.
