# HR Platform Backend

Node.js + Express + PostgreSQL + Prisma backend for the Enterprise HR Management Platform.

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** PostgreSQL 16
- **ORM:** Prisma 5
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Validation:** Custom Joi-like validators
- **File Uploads:** Multer
- **Email:** Nodemailer (Ethereal for dev)
- **Logging:** Winston
- **Testing:** Jest + Supertest

## Project Structure

```
hr-platform-backend/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Prisma migrations
├── src/
│   ├── app.js                  # Express app setup
│   ├── config/                 # Configuration modules
│   │   ├── database.js         # Prisma client singleton
│   │   ├── env.js              # Environment variable validation
│   │   ├── mailer.js           # Nodemailer transport
│   │   └── multer.js           # File upload config
│   ├── controllers/            # Request handlers (7 modules)
│   ├── middlewares/             # Express middlewares
│   │   ├── auth.middleware.js   # JWT verification
│   │   ├── role.middleware.js   # Role-based access control
│   │   ├── validate.middleware.js # Request validation
│   │   └── error.middleware.js  # Global error handler
│   ├── routes/                 # Route definitions (8 modules)
│   ├── services/               # Business logic layer (8 modules)
│   ├── utils/                  # Utility functions
│   │   ├── jwt.js              # JWT token helpers
│   │   ├── logger.js           # Winston logger
│   │   ├── date.js             # Date formatting
│   │   └── token.js            # Token generation
│   └── validators/             # Request schemas (7 modules)
├── tests/                      # Jest test suites
│   ├── auth.test.js            # Authentication tests
│   ├── leave.test.js           # Leave request tests
│   ├── setup.js                # Test setup/teardown
│   ├── helpers.js              # Test helper functions
│   └── env.js                  # Test environment
├── logs/                       # Application logs (gitignored)
├── uploads/                    # File uploads (gitignored)
├── server.js                   # Entry point
├── Dockerfile                  # Production Docker image
├── Dockerfile.ci               # CI-optimized Docker image
├── jest.config.js              # Jest configuration
└── package.json                # Dependencies & scripts
```

## CI/CD Files

### `Dockerfile.ci` — CI Test Runner Image

Multi-stage Docker image used by the Jenkins pipeline (and for local CI simulation):

```dockerfile
FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl  # Prisma dependency
COPY package*.json ./ && npm install
COPY prisma ./prisma && npx prisma generate
COPY . .
```

### `.env.test` — Test Environment Variables

Located at `hr-platform-backend/.env.test` (gitignored). Example:

```
PORT=5001
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test
JWT_SECRET=test_secret_key_for_testing_only
JWT_EXPIRES_IN=1d
```

## Running Tests

### Prerequisites

PostgreSQL must be running. The project uses Docker:

```bash
docker run -d --name hr-postgres \
  -e POSTGRES_USER=hr_admin \
  -e POSTGRES_PASSWORD=HrPlatform2026! \
  -e POSTGRES_DB=hr_platform_test \
  -p 5433:5432 postgres:16
```

### Run Tests

```bash
# Single quotes are REQUIRED in zsh (the ! in password triggers history expansion)
DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' \
  npx prisma migrate deploy

DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' \
  npx jest --forceExit --detectOpenHandles
```

### Current Test Coverage

| Suite     | Tests  | Status             |
| --------- | ------ | ------------------ |
| Auth      | 7      | ✅ Passing         |
| Leave     | 4      | ✅ Passing         |
| **Total** | **11** | **✅ All passing** |

### Local CI Simulation

Run the exact same pipeline as Jenkins:

```bash
cd ..
docker compose -f docker-compose.ci.yml up --build \
  --abort-on-container-exit --exit-code-from test-runner \
  --remove-orphans
```

## Available Scripts

| Script         | Description                   |
| -------------- | ----------------------------- |
| `npm start`    | Start production server       |
| `npm run dev`  | Start dev server with nodemon |
| `npm test`     | Run Jest tests                |
| `npm run lint` | Lint code (if configured)     |

## Troubleshooting

### `zsh: event not found: @localhost`

The password `HrPlatform2026!` contains `!`. In zsh, `!` triggers history expansion.
**Always use single quotes:**

```bash
# Correct
DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' npx jest
```

---

See the project root `README.md` for full setup and CI/CD documentation.
