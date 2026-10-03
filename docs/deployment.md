# Hostinger frontend deployment

`.github/workflows/deploy.yml` adapts the SSH/SCP deployment from
`~/servers/mcube/.github/workflows/deploy.yml`. It deploys the BrightP portal on
portal changes pushed to `main`, or manually from GitHub Actions:

| Frontend | Build command | Uploaded directory | Domain |
| --- | --- | --- | --- |
| BrightP portal | `npm run build` in `BrightP` | `BrightP/build` | `portal.brightwingstravel.com` |

The workflow checks out this repository and only builds and deploys the portal.
The backend is never built, tested, or deployed by this workflow.
BrightP receives an Apache `.htaccess` fallback for client routes if its build
does not already provide one.

## GitHub Actions secrets

Set these under repository Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `SSH_HOST` | Hostinger SSH hostname or IP |
| `SSH_USER` | Hostinger SSH username |
| `SSH_PORT` | SSH port shown in hPanel, digits only (1–65535); do not paste the hostname, `:PORT`, or a full SSH command |
| `SSH_KEY` or `SSH_KEY_B64` | Full private key or its base64 encoding; base64 takes precedence |
| `SSH_KNOWN_HOSTS` (optional) | Verified server host-key entry in OpenSSH known_hosts format; for a custom port use `[HOST]:PORT`. If unset, the workflow uses `ssh-keyscan` |
| `REACT_APP_API_URL` | Production backend URL used by BrightP |

By default, the workflow publishes to `~/domains/portal.brightwingstravel.com/public_html`
on the server. Create the portal website in hPanel first. If hPanel uses a different
document root, set the optional `PORTAL_DEPLOY_PATH` secret to its absolute path.
The destination must exist and point to the portal website's document root.
Enable SSH access in Hostinger and install
the matching public key there. Frontend API URLs are embedded in the build;
they must be reachable by visitors' browsers. Frontend variables become public
browser code; never put private API credentials in them.

If deployment fails in Configure SSH with `Bad port`, update the
`SSH_PORT` repository secret to contain only the SSH port shown in hPanel.
The workflow trims surrounding whitespace and validates the port before using it.

To obtain `SSH_KNOWN_HOSTS`, run `ssh-keyscan -p PORT HOST` from your machine,
verify the fingerprint against a trusted Hostinger/server source, then store
the matching known_hosts entry. If this secret is unset, the workflow fetches
the host key during deployment; that fallback does not independently verify
the server's identity. Strict host-key checking remains enabled for SSH/SCP.
Keep the destination path under your SSH account's
`~/domains/` directory; resolved paths outside it are rejected.

Optional secrets: `REACT_APP_RESOURCE_URL` (default
`https://resource.brightwingstravel.in`), and `REACT_APP_PORTAL_URL` (default
`https://portal.brightwingstravel.com`).

## Frontend source

`BrightP`, `Go_Travel_Brightwings`, and `backend` are ordinary directories stored
in `https://github.com/neeraj9649/Brightnew`. There are no submodules or nested
Git repositories. Actions uses its built-in token; `SUBMODULE_TOKEN` is not
needed. To deploy portal changes, commit and push them directly to this
repository's `main` branch.

Builds and deployment run in separate jobs. SSH secrets are only used by the
deployment jobs, which accept runs from `main` only and never run npm or scripts
from the downloaded build. GitHub actions are pinned to commit SHAs.

Uploads land in a private staging directory for each app and run. Every uploaded
file is checked with SHA-256 before publication. Hostinger must provide Bash,
`sha256sum`, `realpath`, and `mktemp`. Publication rejects destination symlinks,
backs up existing files that will be overwritten under
`~/.brightnew-backups/DOMAIN/RUN/`, then replaces each file by a rename, with
`index.html` last. Old assets and unrelated files are retained, so this workflow
does not delete directories in the live website.

Publication is not an atomic whole-site switch and does not automatically roll
back: a failed publication can leave some files updated. Backups are available
for manual recovery. Old assets and backups accumulate and should be pruned
when no longer needed. A running deployment finishes before the next run starts.
