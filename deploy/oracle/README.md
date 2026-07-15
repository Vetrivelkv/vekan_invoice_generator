# Oracle Cloud deployment

This stack deploys the React production build, Node/Express API, RethinkDB and
Caddy to one Oracle Cloud VM. Only ports 80 and 443 are public. RethinkDB's
driver and Data Explorer ports bind to the VM's loopback interface.

## 1. Prepare the VM once

Create an Ubuntu ARM64 Always Free instance and allow inbound TCP ports 22, 80
and 443 in both the OCI network security rules and the VM firewall. Install
Docker Engine and the Docker Compose plugin from Docker's official Ubuntu
repository.

Allow the SSH deployment user to run Docker and own the deployment directory:

```bash
sudo usermod -aG docker "$USER"
sudo mkdir -p /opt/vekan
sudo chown -R "$USER":"$USER" /opt/vekan
newgrp docker
docker version
docker compose version
```

Point the DNS A record for the application domain to the VM public IP. Caddy
will obtain and renew HTTPS certificates automatically.

## 2. Configure GitHub

Create a GitHub environment named `production`. Add these repository or
environment variables:

- `APP_DOMAIN`: domain only, for example `invoice.example.com`
- `CORS_ORIGIN`: full origin, for example `https://invoice.example.com`

Add these GitHub secrets:

- `ORACLE_HOST`: VM public IP or hostname
- `ORACLE_USER`: SSH deployment user, commonly `ubuntu`
- `ORACLE_SSH_PORT`: normally `22` (optional)
- `ORACLE_SSH_PRIVATE_KEY`: private deployment key
- `ORACLE_KNOWN_HOSTS`: output from `ssh-keyscan -H <ORACLE_HOST>`
- `JWT_ACCESS_SECRET`: output from `openssl rand -hex 64`
- `JWT_REFRESH_SECRET`: a second independent `openssl rand -hex 64` value

Add the matching public SSH key to `~/.ssh/authorized_keys` on the VM. Never
commit the private key or production environment file.

## 3. Deploy

Pull requests to `main` run checks and build the production image. A push to
`main`, or a manual workflow run on `main`, deploys after verification passes.
The workflow serializes production deployments, runs RethinkDB migrations,
checks `/api/health`, retains five releases and preserves the named database
volume across deployments.

## Database access and backup

Do not open ports 39015 or 39080 in OCI. Access the Data Explorer through SSH:

```bash
ssh -L 39080:127.0.0.1:39080 ubuntu@YOUR_VM_IP
```

Then open `http://127.0.0.1:39080`. Configure regular RethinkDB dumps and copy
them off the VM before treating the deployment as production data.
