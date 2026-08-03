# Enterprise HR Management Platform

A full-stack HR management system built with React, Node.js/Express, PostgreSQL,
and Prisma ORM — featuring role-based authentication, employee lifecycle management,
leave/attendance tracking, salary history, document uploads, and audit logging.

Beyond the application itself, this project is also a full **DevOps/Platform Engineering
roadmap** — the same codebase has been progressively wired up with CI/CD, containerization,
Kubernetes, GitOps, Infrastructure as Code, configuration management, and observability.

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma ORM, JWT auth, bcrypt, Multer, Nodemailer, Winston
**Frontend:** React, React Router, Tailwind CSS, Axios, Recharts, Lucide icons
**DevOps:** Docker, Docker Compose, Jenkins CI/CD, Kubernetes (Minikube), Argo CD, Terraform, Ansible, Prometheus, Grafana, Loki

## Project Structure

```
hr-platform/
├── hr-platform-backend/         # REST API (Express + Prisma + PostgreSQL)
├── hr-platform-frontend/        # React SPA (Vite + Tailwind CSS)
├── k8s/                         # Kubernetes manifests (Deployments, Services, Ingress, HPA, etc.)
├── terraform/                   # Infrastructure as Code (VPC, IAM, EC2, S3 via LocalStack)
├── ansible/                     # Server provisioning playbook (Docker install, app directories)
├── monitoring/dashboards/       # Exported Grafana dashboard definitions (as code)
├── docker-compose.yml           # Local dev orchestration
├── docker-compose.ci.yml        # CI orchestration
├── Jenkinsfile                  # Jenkins CI/CD pipeline definition
└── TODO.md                      # Task tracking
```

## Roles & Permissions

- **Admin** — full access: manages departments, HR/employee accounts, views audit logs
- **HR** — manages employees, salary records, leave approvals, attendance, documents
- **Employee** — self-service: views own profile, submits leave requests, checks in/out, views own salary/documents

## Features

- JWT authentication with bcrypt password hashing
- Role-based and ownership-based authorization throughout
- Employee, Department, Leave Request, Attendance, Salary, and Document modules
- Password reset via email (Nodemailer + Ethereal for local dev)
- Audit logging of sensitive actions
- Automated tests (Jest + Supertest)
- Fully containerized with Docker Compose
- CI/CD pipeline with Jenkins, deploying to Docker Hub
- Deployed on Kubernetes (Minikube), auto-synced via Argo CD (GitOps)
- Infrastructure provisioned via Terraform (simulated AWS via LocalStack)
- Server configuration automated via Ansible
- Live monitoring via Prometheus + Grafana

---

## Running Locally (Docker Compose)

```bash
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

| Service     | URL                                                        |
| ----------- | ---------------------------------------------------------- |
| Frontend    | http://localhost:8090                                      |
| Backend API | http://localhost:5000/api                                  |
| PostgreSQL  | localhost:5433 (user: hr_admin, password: HrPlatform2026!) |

### Running Tests Locally

```bash
cd hr-platform-backend

DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' \
  npx prisma migrate deploy

DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' \
  npx jest --forceExit --detectOpenHandles
```

> **Note:** The `!` in the password triggers zsh history expansion. Always use
> **single quotes** around `DATABASE_URL` when running commands manually in zsh.

---

## Phase 7 — DevSecOps (Jenkins)

The Jenkins pipeline (`Jenkinsfile`) runs on every push to `main`:

```
Checkout → Secret Scan (GitLeaks) → Dependency Scan (OWASP) → Run Backend Tests
  → Static Code Analysis (SonarQube) → Build & Push Docker Images (Docker Hub)
  → Container Vulnerability Scan (Trivy) → Update K8s Manifests (bump image tags)
```

- **GitLeaks** — blocks the build if a secret is committed
- **OWASP Dependency-Check** — scans `package.json` deps for known CVEs (faster with a free
  NVD API key — see below; falls back gracefully to a slower unauthenticated scan if the
  `nvd-api-key` Jenkins credential isn't configured)
- **SonarQube** — static code quality analysis
- **Trivy** — scans built Docker images for OS/package vulnerabilities
- **Update K8s Manifests** — after a successful scan/build, Jenkins bumps the image tag in
  `k8s/backend-deployment.yaml` / `k8s/frontend-deployment.yaml` to the current build number
  and pushes the change back to `main`, which Argo CD then picks up automatically

### Required Jenkins credentials

| Credential ID     | Type                  | Purpose                          |
| ------------------ | --------------------- | --------------------------------- |
| `dockerhub-creds`  | Username with password | Push images to Docker Hub         |
| `github-creds`     | Username with password | Push manifest tag bumps to GitHub |
| `sonarqube-token`  | Secret text            | SonarQube auth                    |
| `nvd-api-key`      | Secret text (optional) | Speeds up OWASP scan              |

Get a free NVD API key at: https://nvd.nist.gov/developers/request-an-api-key

---

## Phase 8 — Kubernetes (Minikube)

The full stack (Postgres, backend, frontend) runs on a local Minikube cluster.

### Setup

```bash
minikube start --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
```

### Deploy

```bash
kubectl apply -f k8s/
```

This creates: `postgres` (Deployment + Service + PVC), `backend` (Deployment with an
init container running `prisma migrate deploy` + Service + PVC for uploads), `frontend`
(Deployment + Service), an `Ingress` routing `hr-platform.local` to the frontend, and an
`HorizontalPodAutoscaler` on the backend (scales 1→4 replicas at 50% CPU).

### Access the app

```bash
echo "$(minikube ip) hr-platform.local" | sudo tee -a /etc/hosts
```
Then open `http://hr-platform.local`.

### Secrets (never committed to Git)

```bash
kubectl create secret generic hr-backend-secret \
  --from-literal=DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@postgres-service:5432/hr_platform' \
  --from-literal=JWT_SECRET='replace_with_a_long_random_string' \
  --from-literal=POSTGRES_PASSWORD='HrPlatform2026!'
```
A redacted template documenting the expected keys lives at `k8s/secret.template.yaml`
for reference only — it is intentionally excluded from being applied by Argo CD.

---

## Phase 9 — Argo CD (GitOps)

Argo CD watches the `k8s/` folder on `main` and automatically syncs the cluster to match.

### Install

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Access the UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8443:443
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```
Open `https://localhost:8443`, log in as `admin` with the password above.

### Application config

- Repository: this repo
- Path: `k8s`
- Revision: `main`
- Sync policy: Automatic (prune + self heal enabled)

With this, any commit that changes `k8s/` — including Jenkins' automated image-tag
bumps — is deployed to the cluster within Argo CD's next sync cycle, no manual
`kubectl apply` required.

---

## Phase 10 — Terraform (Infrastructure as Code)

Provisions VPC, IAM, EC2, S3, and Security Groups against **LocalStack** (a local,
simulated AWS API) — no real AWS account or billing required.

### Setup

```bash
docker start localstack   # or: docker run -d -p 4566:4566 localstack/localstack
cd terraform
terraform init
terraform apply
```

The `terraform/provider.tf` file points the AWS provider at `http://localhost:4566`
with dummy credentials and `s3_use_path_style = true` (required for LocalStack's S3
implementation).

### Verify against LocalStack directly

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
aws --endpoint-url=http://localhost:4566 ec2 describe-instances --region us-east-1
aws --endpoint-url=http://localhost:4566 s3 ls
```

> **Scope note:** LocalStack Community edition only supports `ec2`, `iam`, and `s3` —
> services like RDS/ECS/EKS are Pro-only or unavailable, which is why this phase is
> scoped to VPC/IAM/EC2/S3/Security Groups rather than a full managed-service stack.

---

## Phase 11 — Ansible (Configuration Management)

Provisions a target machine with Docker and the application directory structure.
Currently configured to run against **localhost** (since Terraform's EC2 instance is
simulated, not a real reachable server).

### Run

```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml --ask-become-pass
```

Tasks: update apt cache, install required packages, install Docker (skipped if
already present — idempotent), ensure Docker is running, add the current user to the
`docker` group, create `/opt/hr-platform` and `/opt/hr-platform/uploads`.

---

## Phase 12 — Monitoring (Prometheus + Grafana)

Installed via the `kube-prometheus-stack` Helm chart — bundles Prometheus, Grafana,
Alertmanager, node-exporter, and kube-state-metrics.

### Install

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
kubectl create namespace monitoring
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin123
```

### Access Grafana

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80
```
Open `http://localhost:3001` — login `admin` / `admin123`.

A custom dashboard (`HR Platform - CPU Usage by Pod`) is exported and version-controlled
at `monitoring/dashboards/hr-platform-monitoring.json`, tracking real CPU usage
(`rate(container_cpu_usage_seconds_total{namespace="default"}[5m])`) for the
`frontend`, `backend`, and `postgres` pods.

> The bundled pre-built Kubernetes dashboards filter by a `cluster` label that Minikube
> doesn't set, which causes some panels to show "No data" — this is a known dashboard/
> environment mismatch, not a monitoring failure (confirmed via direct PromQL queries
> and Prometheus's own Targets page, both showing real, correctly-scraped data).

---

## Phase 13 — Centralized Logging (Loki) — attempted, resource-constrained

A single-binary Loki + Promtail setup was configured via Helm to ship pod logs into
Grafana, using the same pattern as Phase 12:

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki \
  --namespace monitoring \
  --set deploymentMode=SingleBinary \
  --set loki.commonConfig.replication_factor=1 \
  --set loki.useTestSchema=true \
  --set loki.auth_enabled=false \
  --set loki.storage.type=filesystem \
  --set loki.storage.filesystem.chunks_directory=/var/loki/chunks \
  --set loki.storage.filesystem.rules_directory=/var/loki/rules \
  --set singleBinary.persistence.enabled=false \
  --set gateway.enabled=false --set chunksCache.enabled=false --set resultsCache.enabled=false \
  --set backend.replicas=0 --set read.replicas=0 --set write.replicas=0

helm install promtail grafana/promtail \
  --namespace monitoring \
  --set "config.clients[0].url=http://loki:3100/loki/api/v1/push"
```

Grafana data source: **Loki**, URL `http://loki:3100`.

> **Status:** configuration is correct and documented above for reference, but was not
> kept running long-term in this environment due to the host machine's limited available
> memory (a full Prometheus/Grafana/Argo CD/Jenkins stack plus Loki exceeded practical
> headroom on a resource-constrained development laptop). On a machine with more
> available RAM, or a dedicated logging namespace with resource limits set, this
> configuration is expected to run cleanly.

---

## CI/CD Pipeline Summary

```
┌────────────────────────────────────────────────────────────────────┐
│                         Jenkins (CI)                                │
│  Checkout → GitLeaks → OWASP → Tests → SonarQube → Build/Push       │
│  → Trivy → Bump k8s/ image tags → push to Git                       │
└──────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                         Argo CD (CD / GitOps)                       │
│  Watches k8s/ on main → auto-syncs cluster to match Git              │
└──────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Minikube (Kubernetes cluster)                    │
│  postgres · backend · frontend · Ingress · HPA                      │
│  + Prometheus/Grafana (monitoring) · Loki (logging, as documented)  │
└────────────────────────────────────────────────────────────────────┘
```

## Environment Variables

| Variable         | Description                  | Example                               |
| ---------------- | ----------------------------- | -------------------------------------- |
| `PORT`           | Backend API port              | `5000`                                 |
| `DATABASE_URL`   | PostgreSQL connection string  | `postgresql://user:pass@host:5432/db`  |
| `JWT_SECRET`     | JWT signing key               | `your-secret-key`                      |
| `JWT_EXPIRES_IN` | JWT token expiry              | `1d`                                   |
| `FRONTEND_URL`   | Frontend origin for CORS      | `http://hr-platform.local`             |

---

## Troubleshooting

### `zsh: event not found: @localhost`
The `!` in the password triggers zsh history expansion — always use **single quotes**
around `DATABASE_URL`.

### `Conflict. The container name X is already in use`
```bash
docker rm -f <container-name>
```

### Terraform hangs on `aws_s3_bucket` creation against LocalStack
Add `s3_use_path_style = true` to the AWS provider block — LocalStack requires
path-style S3 addressing.

### Ansible: `python3-apt must be installed and visible from /usr/bin/python3`
Common on machines with Anaconda/Miniconda installed, which can shadow the system
Python. Avoid the issue entirely by using `command: apt-get ...` tasks instead of
Ansible's `apt` module, as done in `ansible/playbook.yml`.

### Argo CD: `server.secretkey is missing`
Occurs if `argocd-secret` gets overwritten (e.g. by a `--server-side --force-conflicts`
re-apply of the install manifest). Fix: `kubectl -n argocd rollout restart deployment argocd-server`.

### A Secret gets silently reset to placeholder values after an Argo CD sync
Check whether a template/example Secret manifest (e.g. `secret.template.yaml`) is
sitting inside the path Argo CD watches (`k8s/`) — move it outside that path (this repo
keeps it at `docs/secret.template.yaml`) so Argo CD never applies it over the real Secret.

---

## Status

- ✅ Backend API, Frontend SPA, Docker, Git — complete
- ✅ Phase 7 — DevSecOps (Jenkins: GitLeaks, OWASP, SonarQube, Trivy)
- ✅ Phase 8 — Kubernetes (Minikube: Deployments, Services, Ingress, HPA)
- ✅ Phase 9 — Argo CD (GitOps auto-sync)
- ✅ Phase 10 — Terraform (VPC, IAM, EC2, S3 via LocalStack)
- ✅ Phase 11 — Ansible (Docker + app directory provisioning)
- ✅ Phase 12 — Monitoring (Prometheus + Grafana, custom dashboard as code)
- 🟡 Phase 13 — Centralized Logging (Loki configured and documented; not kept running
  long-term due to host memory constraints)
- 🔲 Phase 14 — Production Deployment (HTTPS, domain, hardening) — planned