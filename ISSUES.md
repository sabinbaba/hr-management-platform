# CI/CD Issue Resolution Log

This document tracks every issue encountered while setting up Jenkins CI/CD for the HR Platform, along with the root cause analysis, changes made, and final solution.

---

## Issue 1: DATABASE_URL Not Found in CI

### Problem

The Jenkins build failed with:

```
Environment variable not found: DATABASE_URL
```

### Root Cause

The original `Jenkinsfile` tried to run `npm test` directly inside a `node:20-slim` Jenkins agent container. This container had:

- No PostgreSQL database running
- No `.env.test` file present (the file is gitignored: `**/.env.test` in `.gitignore`)
- No way to connect to an external database from inside the CI container

The tests require a live PostgreSQL database to run Prisma migrations and execute test queries against.

### Solution Approach

Instead of running tests on the Jenkins agent directly, create an **isolated Docker Compose environment** that provides:

1. A PostgreSQL 16 database container (with healthcheck)
2. A test-runner container built from the backend code
3. An internal Docker network for them to communicate

### Changes Made

#### New File: `docker-compose.ci.yml`

Defines two services on an isolated `ci-network`:

- **`postgres-test`**: PostgreSQL 16 with `tmpfs` storage (ephemeral — data lost on stop)
- **`test-runner`**: Builds from `Dockerfile.ci`, waits for `postgres-test` to be healthy, then runs `npx prisma migrate deploy && npm test`

Key design:

```yaml
services:
  postgres-test:
    image: postgres:16
    expose:
      - "5432" # Internal only — no host port mapping
    tmpfs: /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hr_admin -d hr_platform_test"]

  test-runner:
    build:
      context: ./hr-platform-backend
      dockerfile: Dockerfile.ci
    depends_on:
      postgres-test:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://hr_admin:HrPlatform2026!@postgres-test:5432/hr_platform_test
    command: >
      sh -c "
        npx prisma migrate deploy &&
        npm test
      "
```

#### New File: `hr-platform-backend/Dockerfile.ci`

Lightweight CI Docker image:

```dockerfile
FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./ && npm install
COPY prisma ./prisma && npx prisma generate
COPY . .
```

#### Modified File: `Jenkinsfile`

Rewritten from direct test execution to use Docker Compose:

```groovy
stage('Run Backend Tests') {
    steps {
        checkout scm
        sh 'docker compose -f docker-compose.ci.yml up --build --abort-on-container-exit --exit-code-from test-runner'
    }
    post {
        always {
            sh 'docker compose -f docker-compose.ci.yml down -v'
        }
    }
}
```

---

## Issue 2: Stash/Unstash `Failed to extract workspace.tar.gz`

### Problem

```
java.io.IOException: Failed to extract workspace.tar.gz
  at hudson.FilePath.readFromTar(FilePath.java:3137)
  at hudson.FilePath$UntarLocal ...
```

### Root Cause

The pipeline used `agent none` with a **Checkout** stage that stashed the workspace, then **Run Backend Tests** and **Build Docker Images** stages that unstashed it. When Jenkins agents run on different machines (e.g., master vs. build node), the stash mechanism compresses the workspace into a tarball and transfers it over the network. This transfer can fail due to:

- Network timeouts
- Disk space issues on the target agent
- Permission issues with the tar extraction

### Solution

Replace `stash/unstash` with **`checkout scm` in every stage**. Each stage independently checks out the source code from the Git repository, eliminating the need to transfer workspace files between agents.

### Changes Made

#### Modified File: `Jenkinsfile`

```groovy
// BEFORE
pipeline {
    agent none
    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
                stash includes: '**/*', name: 'workspace'
            }
        }
        stage('Run Backend Tests') {
            agent any
            steps {
                unstash 'workspace'
                // ...
            }
        }
    }
}

// AFTER
pipeline {
    agent any
    stages {
        stage('Run Backend Tests') {
            steps {
                checkout scm
                // ...
            }
        }
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        checkout scm
                        // ...
                    }
                }
                stage('Build Frontend') {
                    steps {
                        checkout scm
                        // ...
                    }
                }
            }
        }
    }
}
```

Additionally, changed `agent none` → `agent any` so a single agent can run all stages sequentially without needing to coordinate across multiple agents.

---

## Issue 3: Container Name Conflict `already in use`

### Problem

```
Error response from daemon: Conflict. The container name "/hr-postgres-ci" is already in use
```

### Root Cause

The `docker-compose.ci.yml` used **fixed `container_name`** values:

```yaml
services:
  postgres-test:
    container_name: hr-postgres-ci # Fixed name
  test-runner:
    container_name: hr-test-runner # Fixed name
```

When a CI build was aborted or crashed before `docker compose down -v` could run, the containers remained running. The **next build** tried to create containers with the same fixed names, which Docker rejected because they already existed.

### Solution

1. **Remove `container_name`** from both services — Docker Compose auto-generates unique names using the pattern `{project}_{service}_1`
2. **Scope project name per build** — Set `COMPOSE_PROJECT_NAME` to `hr-ci-${BUILD_NUMBER}`, so each build gets a unique project namespace (e.g., `hr-ci-42_postgres-test_1`, `hr-ci-43_postgres-test_1`)
3. **Add `--remove-orphans`** — Cleans up containers from aborted or previous builds that may have been left behind

### Changes Made

#### Modified File: `docker-compose.ci.yml`

```yaml
# BEFORE
services:
  postgres-test:
    container_name: hr-postgres-ci
    # ...
  test-runner:
    container_name: hr-test-runner

# AFTER — removed both container_name lines
services:
  postgres-test:
    # container_name removed — auto-generated
  test-runner:
    # container_name removed — auto-generated
```

#### Modified File: `Jenkinsfile`

```groovy
// Added environment variable and flags
pipeline {
    agent any
    environment {
        COMPOSE_PROJECT_NAME = "hr-ci-${BUILD_NUMBER}"   // Unique per build
    }
    stages {
        stage('Run Backend Tests') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml up --build
                    --abort-on-container-exit --exit-code-from test-runner
                    --remove-orphans'   // New flag
            }
            post {
                always {
                    sh 'docker compose -f docker-compose.ci.yml down -v
                        --remove-orphans'   // New flag
                }
            }
        }
    }
}
```

---

## Issue 4: Docker Host Port Conflict (Development vs. CI)

### Problem

Noticed during local testing that if the development `hr-postgres` container (mapped to `5433:5432`) was running, the CI compose file's `postgres-test` would fail if it also tried to bind to a host port.

### Root Cause

The original `docker-compose.ci.yml` had:

```yaml
ports:
  - "5433:5432"
```

This would conflict with the existing `hr-postgres` development container already using port `5433` on the host.

### Solution

CI services don't need host ports — the `test-runner` and `postgres-test` communicate over an internal Docker bridge network. Changed `ports` → `expose`:

```yaml
# BEFORE
ports:
  - "5433:5432"

# AFTER — internal only, no host port binding
expose:
  - "5432"
```

This also:

- Eliminates any port conflicts with the development environment
- Allows concurrent CI builds and local development on the same machine
- Follows Docker security best practices (only expose what's needed internally)

---

## Issue 5: zsh `!` History Expansion in DATABASE_URL

### Problem

```bash
DATABASE_URL="postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test" npx prisma migrate deploy
# Error: zsh: event not found: @localhost
```

### Root Cause

The password `HrPlatform2026!` contains an **exclamation mark (`!`)**. In **zsh** (and some other shells), `!` triggers **history expansion** — it's used to reference previous commands (e.g., `!$` = last argument of last command, `!!` = last command).

The shell interpreted `!@localhost` as a history event reference starting with `@localhost`, which doesn't exist in the history, causing the error.

This was not a CI issue per se, but affected local development and debugging.

### Solution

**Always use single quotes** (`'...'`) around the `DATABASE_URL` value when running commands in zsh. Single quotes prevent **all** shell interpretation:

- No history expansion (`!`)
- No variable expansion (`$`)
- No globbing (`*`, `?`)
- No command substitution (`` ` ``, `$()`)

```bash
# CORRECT — single quotes prevent all shell expansion
DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' npx prisma migrate deploy
```

Note: This issue does **not** affect the CI pipeline because Docker Compose passes environment variables directly to containers without going through a shell expansion step.

---

## Files Created

| #   | File                                | Purpose                                     |
| --- | ----------------------------------- | ------------------------------------------- |
| 1   | `docker-compose.ci.yml`             | CI orchestration: PostgreSQL + test-runner  |
| 2   | `hr-platform-backend/Dockerfile.ci` | CI-optimized Docker image for running tests |

## Files Modified

| #   | File                            | Changes                                                                                                                                |
| --- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Jenkinsfile`                   | Rewritten from direct test execution to Docker Compose. Removed stash/unstash. Added `COMPOSE_PROJECT_NAME`. Added `--remove-orphans`. |
| 2   | `docker-compose.ci.yml`         | Removed `container_name`. Changed `ports` → `expose`.                                                                                  |
| 3   | `hr-platform-backend/.env.test` | Updated port from `5432` → `5433`                                                                                                      |
| 4   | `README.md`                     | Added CI/CD documentation, troubleshooting guide                                                                                       |
| 5   | `hr-platform-backend/README.md` | Added backend-specific CI/CD documentation                                                                                             |
| 6   | `TODO.md`                       | Updated to mark all tasks complete                                                                                                     |

---

## Final CI Pipeline Flow

```
┌────────────────────────────────────────────────────────────┐
│                    Jenkins Pipeline                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              1. Run Backend Tests                     │  │
│  │                                                       │  │
│  │  ┌─────────────────────┐    ┌─────────────────────┐  │  │
│  │  │   docker compose    │    │   docker compose    │  │  │
│  │  │   up --build ...    │───▶│   down -v           │  │  │
│  │  └─────────────────────┘    └─────────────────────┘  │  │
│  │         │                                              │  │
│  │         ▼                                              │  │
│  │  ┌──────────────────────────────────────┐              │  │
│  │  │         CI Network                    │              │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  │              │  │
│  │  │  │ postgres-test │  │ test-runner  │  │              │  │
│  │  │  │ (PostgreSQL)  │◀─│ (runs tests) │  │              │  │
│  │  │  └──────────────┘  └──────────────┘  │              │  │
│  │  └──────────────────────────────────────┘              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           2. Build Docker Images (Parallel)           │  │
│  │                                                       │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐    │  │
│  │  │  Backend Image      │  │  Frontend Image     │    │  │
│  │  │  hr-platform-backend│  │  hr-platform-frontend│   │  │
│  │  └─────────────────────┘  └─────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Status

All issues resolved. Jenkins pipeline passes end-to-end with **11/11 tests passing** across 2 test suites (auth + leave).
