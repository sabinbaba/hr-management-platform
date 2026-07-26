# Tasks

---

## [DONE] Fix test failures (DATABASE_URL not found)

## Steps:

1. [x] Create `hr_platform_test` database in PostgreSQL container
2. [x] Fix `.env.test` - update port from `5432` to `5433`
3. [x] Run Prisma migrations on the test database
4. [x] Run `npm test` to verify all tests pass

---

## [DONE] Fix Jenkins pipeline — tests fail with DATABASE_URL not found

### Problem

Jenkins runs tests in a bare `node:20-slim` container with no PostgreSQL database and no `.env.test` (gitignored). All 11 tests fail.

### Changes

| File                                | Action        | Purpose                                                       |
| ----------------------------------- | ------------- | ------------------------------------------------------------- |
| `docker-compose.ci.yml`             | **Created**   | Spins up PostgreSQL + test-runner for CI                      |
| `hr-platform-backend/Dockerfile.ci` | **Created**   | CI-specific Dockerfile with dev deps + full source            |
| `Jenkinsfile`                       | **Rewritten** | Uses docker compose for tests, parallel builds, stash/unstash |

### Steps:

1. [x] Create `docker-compose.ci.yml` — postgres-test + test-runner with health check
2. [x] Create `Dockerfile.ci` — includes dev dependencies for testing
3. [x] Rewrite `Jenkinsfile` — single checkout → docker compose test → parallel Docker builds
4. [x] Commit and push all changes
