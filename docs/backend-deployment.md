# Backend deployment (Rust API)

The portal at `https://portal.brightwingstravel.com` calls the API configured in
`REACT_APP_API_URL` in the deployment workflow (`https://bp.nsiif.in`).
**The portal cannot sign anyone in until that URL serves this backend.**

## One-time server setup (Ubuntu/Debian VPS)

```sh
sudo apt install -y nginx postgresql certbot python3-certbot-nginx libssl3
sudo useradd --system --home /opt/bright-wings --shell /usr/sbin/nologin brightwings
sudo mkdir -p /opt/bright-wings /etc/bright-wings && sudo chown brightwings: /opt/bright-wings

# database
sudo -u postgres psql -c "CREATE USER brightwings WITH PASSWORD '...'" \
                      -c "CREATE DATABASE brightwings OWNER brightwings"

# config (copy backend/deploy/bp.env.example, fill every CHANGE_ME)
sudo install -m 600 bp.env /etc/bright-wings/bp.env

# service, reverse proxy, TLS
sudo cp backend/deploy/bp.service /etc/systemd/system/bp.service && sudo systemctl enable bp
sudo cp backend/deploy/nginx-bp.conf /etc/nginx/sites-available/bp
sudo ln -s /etc/nginx/sites-available/bp /etc/nginx/sites-enabled/bp
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d bp.nsiif.in
```

The DNS record for `bp.nsiif.in` must point at the server running this API.

The deploy user needs passwordless sudo for exactly:
`brightwings-deploy ALL=(root) NOPASSWD: /bin/systemctl restart bp, /bin/journalctl -u bp *`

## Releasing

1. GitHub → Settings → Secrets: `BACKEND_SSH_HOST`, `BACKEND_SSH_USER`,
   `BACKEND_SSH_PORT`, `BACKEND_SSH_KEY`, `BACKEND_DEPLOY_DIR` (`/opt/bright-wings`),
   optional `BACKEND_SSH_KNOWN_HOSTS`, `BACKEND_HEALTH_URL`.
2. Actions → **Build and Deploy Backend** → Run workflow → type `deploy`.
   It runs the tests, builds offline, swaps the binary, restarts the service and
   rolls back if `/health` does not answer. Database migrations run on start-up.
3. Only then push the portal (the Hostinger workflow publishes it).

Smoke test: `curl https://bp.nsiif.in/health` returns 200 with CORS
headers for `https://portal.brightwingstravel.com`.

> The workflow and unit files were written without access to the server and have
> not been run against it. Check them on a staging box first.

## Alternative: managed host (no server administration)

`backend/Dockerfile` builds the API for any container host, and `render.yaml`
is a ready Render blueprint (managed Postgres + web service, secrets generated
for you). After the first deploy:

1. Note the service URL (e.g. `https://brightwings-api.onrender.com`) and open
   `/health` — it must return 200.
2. Set the portal's `REACT_APP_API_URL` GitHub secret to that URL (or point
   `bp.guildarts.online` at it with a CNAME) and re-run the portal workflow;
   the URL is compiled into the portal build.
3. The API sets a `SameSite=None; Secure` refresh cookie, so it must be served
   over HTTPS (Render does this automatically).

The Docker build has not been run in this environment; if it fails on your host,
the log will name the missing system package.
