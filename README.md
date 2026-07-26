# Enterprise HR Management Platform

A full-stack HR management system built with React, Node.js/Express, PostgreSQL,
and Prisma ORM — featuring role-based authentication, employee lifecycle management,
leave/attendance tracking, salary history, document uploads, and audit logging.

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma ORM, JWT auth, bcrypt, Multer, Nodemailer, Winston
**Frontend:** React, React Router, Tailwind CSS, Axios, Recharts, Lucide icons
**DevOps:** Docker, Docker Compose, Jenkins CI/CD

## Project Structure

```
hr-platform/
├── hr-platform-backend/         # REST API (Express + Prisma + PostgreSQL)
│   ├── prisma/                  # Prisma schema & migrations
│   ├── src/                     # Application source code
│   │   ├── config/              # Configuration (DB, env, mailer, multer)
│   │   ├── controllers/         # Request handlers
│   │   ├── middlewares/         # Auth, role, validation, error handling
│   │   ├── routes/              # Express route definitions
│   │   ├── services/            # Business logic layer
│   │   ├── utils/               # JWT, logger, date helpers
│   │   └── validators/          # Request validation schemas
│   ├── tests/                   # Jest + Supertest test suites
│   ├── Dockerfile               # Production Docker image
│   ├── Dockerfile.ci            # CI-optimized Docker image
│   └── jest.config.js           # Test configuration
├── hr-platform-frontend/        # React SPA (Vite + Tailwind CSS)
├── docker-compose.yml           # Local development orchestration
├── docker-compose.ci.yml        # CI pipeline orchestration
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
- Automated tests (Jest + Supertest — 11 tests, 2 suites)
- Fully containerized with Docker Compose
- CI/CD pipeline with Jenkins

---

## Running Locally

### Option 1: Docker Compose (recommended)

```bash
# Build and start all services
docker compose up -d --build

# Run database migrations
docker compose exec backend npx prisma migrate deploy
```

| Service     | URL                                                        |
| ----------- | ---------------------------------------------------------- |
| Frontend    | http://localhost:8090                                      |
| Backend API | http://localhost:5000/api                                  |
| PostgreSQL  | localhost:5433 (user: hr_admin, password: HrPlatform2026!) |

### Option 2: Manual (without Docker)

See `hr-platform-backend/README.md` and `hr-platform-frontend/README.md` for
individual setup instructions (Node.js, PostgreSQL, environment variables).

### Running Tests Locally

```bash
cd hr-platform-backend

# Prerequisite: PostgreSQL must be running (e.g. via Docker)
# Docker container is already configured:
#   docker run -d --name hr-postgres \
#     -e POSTGRES_USER=hr_admin \
#     -e POSTGRES_PASSWORD=HrPlatform2026! \
#     -e POSTGRES_DB=hr_platform_test \
#     -p 5433:5432 postgres:16

# IMPORTANT: Use single quotes for DATABASE_URL to avoid zsh '!' expansion
DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' \
  npx prisma migrate deploy

DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' \
  npx jest --forceExit --detectOpenHandles
```

> **Note:** The `!` character in the password triggers zsh history expansion. Always
> use **single quotes** (`'...'`) around the `DATABASE_URL` value when running
> commands manually in zsh.

---

## CI/CD Pipeline (Jenkins)

The project includes a complete Jenkins CI/CD pipeline defined in `Jenkinsfile`.

### Pipeline Stages

```
┌─────────────────────┐
│  1. Run Tests       │  ← Spins up PostgreSQL, runs migrations, executes tests
├─────────────────────┤
│  2a. Build Backend  │  ← Builds production Docker image for backend
│  2b. Build Frontend │  ← Builds production Docker image for frontend
└─────────────────────┘
```

### How It Works

The pipeline uses **Docker Compose** to create an isolated, ephemeral test
environment — no dependency on Jenkins agent software beyond Docker.

#### CI Architecture (`docker-compose.ci.yml`)

```
┌──────────────────────────────────┐
│         ci-network               │
│  ┌─────────────┐  ┌───────────┐ │
│  │ postgres-test│  │test-runner│ │
│  │  (PostgreSQL │←─── depends  │ │
│  │   16, tmpfs) │  │  on       │ │
│  │              │  │ healthy   │ │
│  └─────────────┘  └─────┬─────┘ │
└─────────────────────────┼───────┘
                          │
                    ┌─────▼─────┐
                    │ 1. prisma │
                    │   migrate │
                    │   deploy  │
                    │ 2. npm    │
                    │   test    │
                    └───────────┘
```

| Service         | Description                                          |
| --------------- | ---------------------------------------------------- |
| `postgres-test` | PostgreSQL 16 with tmpfs storage (data lost on stop) |
| `test-runner`   | Builds from `Dockerfile.ci`, waits for DB health     |

#### CI Dockerfile (`Dockerfile.ci`)

A lightweight, CI-optimized image based on `node:20-slim`:

```dockerfile
FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl  # Prisma needs openssl
COPY package*.json ./ && npm install
COPY prisma ./prisma && npx prisma generate
COPY . .
```

### Jenkinsfile Reference

```groovy
pipeline {
    agent any
    environment {
        COMPOSE_PROJECT_NAME = "hr-ci-${BUILD_NUMBER}"   // Unique per build
    }
    stages {
        stage('Run Backend Tests') {
            steps {
                checkout scm
                sh 'docker compose -f docker-compose.ci.yml up --build
                    --abort-on-container-exit --exit-code-from test-runner
                    --remove-orphans'
            }
            post {
                always {
                    sh 'docker compose -f docker-compose.ci.yml down -v --remove-orphans'
                }
            }
        }
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') { /* docker build ... */ }
                stage('Build Frontend') { /* docker build ... */ }
            }
        }
    }
}
```

### Key Design Decisions

| Decision                           | Rationale                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **No stash/unstash**               | `checkout scm` per stage avoids `Failed to extract workspace.tar.gz` across different Jenkins agents |
| **No fixed container_name**        | Removed to prevent `Conflict. The container name "/hr-postgres-ci" is already in use` errors         |
| **COMPOSE_PROJECT_NAME per build** | Each build gets a unique project scope (e.g. `hr-ci-42`), so containers never collide                |
| **--remove-orphans**               | Cleans up containers from aborted/previous builds                                                    |
| **tmpfs for PostgreSQL**           | Database runs entirely in memory — no disk persistence needed for tests                              |
| **Internal network only**          | Services communicate over Docker's bridge network; no host ports exposed                             |

### Local CI Simulation

You can run the exact same CI pipeline locally:

```bash
docker compose -f docker-compose.ci.yml up --build \
  --abort-on-container-exit --exit-code-from test-runner \
  --remove-orphans
```

---

## Environment Variables

| Variable         | Description                  | Example                               |
| ---------------- | ---------------------------- | ------------------------------------- |
| `PORT`           | Backend API port             | `5001`                                |
| `DATABASE_URL`   | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET`     | JWT signing key              | `your-secret-key`                     |
| `JWT_EXPIRES_IN` | JWT token expiry             | `1d`                                  |
| `FRONTEND_URL`   | Frontend origin for CORS     | `http://localhost:5173`               |

Test environment variables are in `hr-platform-backend/.env.test` (gitignored —
never commit real secrets).

---

## Troubleshooting

### `zsh: event not found: @localhost`

The `!` in the password triggers zsh history expansion. **Always use single quotes:**

```bash
# WRONG — zsh interprets ! as history expansion
DATABASE_URL="postgresql://hr_admin:HrPlatform2026!@localhost:5433/db" command

# CORRECT — single quotes prevent all shell expansion
DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/db' command
```

### `Conflict. The container name X is already in use`

Remove the stale container:

```bash
docker rm -f <container-name>
# Or for CI: docker compose -f docker-compose.ci.yml down -v --remove-orphans
```

### `Failed to extract workspace.tar.gz`

The Jenkins stash/unstash mechanism fails across different agents. The pipeline
now uses `checkout scm` per stage instead — no fix needed.

---

## Status

- ✅ Backend API — complete
- ✅ Frontend SPA — complete
- ✅ Docker containerization — complete
- ✅ Automated tests — 11 tests, 2 suites (auth + leave)
- ✅ CI/CD pipeline — Jenkins, fully passing
- 🔲 Kubernetes deployment — planned
- 🔲 Monitoring & logging — planned
