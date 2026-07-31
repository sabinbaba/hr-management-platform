# HR Platform — Project Structure

> **Enterprise HR Management Platform** — Full-stack application with React frontend, Node.js/Express backend, PostgreSQL database, Docker containerization, and Jenkins CI/CD pipeline.

```
hr-platform/
│
├── README.md                          # Project overview, tech stack, local setup, CI/CD docs
├── PROJECT_STRUCTURE.md               # THIS FILE — detailed structure documentation
├── TODO.md                            # Task tracking (completed items)
├── ISSUES.md                          # CI/CD issue resolution log
├── sonar-project.properties           # SonarQube static analysis configuration
│
├── docker-compose.yml                 # Local dev orchestration (PostgreSQL + backend + frontend)
├── docker-compose.ci.yml              # CI orchestration (PostgreSQL-test + test-runner)
├── Jenkinsfile                        # Jenkins CI/CD pipeline definition
│
├── kubectl                            # Kubernetes CLI binary (planned deployment)
├── minikube-linux-amd64               # Minikube binary (planned local K8s)
│
├── .gitignore                         # Git ignore rules for root
│
├── hr-platform-backend/               # === REST API (Express + Prisma + PostgreSQL) ===
│   ├── package.json                   # Dependencies: express, prisma, bcrypt, jwt, winston, etc.
│   ├── package-lock.json
│   ├── server.js                      # Entry point — loads env, starts Express on PORT (default 5000)
│   ├── jest.config.js                 # Jest test configuration
│   │
│   ├── Dockerfile                     # Production multi-stage Docker image
│   ├── Dockerfile.ci                  # CI-optimized image (includes dev deps for testing)
│   ├── .dockerignore                  # Docker build context excludes
│   ├── .gitignore                     # Backend-specific git ignores (node_modules, .env, uploads, logs)
│   ├── README.md                      # Backend-specific setup instructions
│   │
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema — 8 models: User, Employee, Department,
│   │   │                              #   Salary, LeaveRequest, Attendance, Document, AuditLog
│   │   ├── migrations/
│   │   │   ├── migration_lock.toml
│   │   │   ├── 20260711121547_init/   # Initial schema migration
│   │   │   │   └── migration.sql
│   │   │   └── 20260718150731_add_password_reset_fields/
│   │   │       └── migration.sql      # Added resetTokenHash, resetTokenExpiresAt to User
│   │
│   ├── src/
│   │   ├── app.js                     # Express app setup — helmet, CORS, JSON parser, routes,
│   │   │                              #   404 handler, centralized error handler, /health endpoint
│   │   │
│   │   ├── config/
│   │   │   ├── database.js            # PrismaClient singleton export
│   │   │   ├── env.js                 # Environment variable validation/loading
│   │   │   ├── mailer.js              # Nodemailer transport (Ethereal for dev)
│   │   │   └── multer.js              # Multer file upload config (disk storage to ./uploads/)
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js      # JWT verification — attaches req.user
│   │   │   ├── role.middleware.js      # Role-based access — authorize('ADMIN', 'HR')
│   │   │   ├── validate.middleware.js  # express-validator validation runner
│   │   │   └── error.middleware.js     # Prisma error mapping + generic error handler
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # POST /register, /login, /forgot-password, /reset-password
│   │   │   │                          # PATCH /change-password
│   │   │   ├── employee.routes.js     # CRUD /employees — GET /my (self-profile), GET /:id
│   │   │   ├── department.routes.js   # CRUD /departments — Admin-only create/update/delete
│   │   │   ├── leave.routes.js        # POST / (employee), GET /my, GET / (HR/Admin all),
│   │   │   │                          #   PATCH /:id (HR/Admin approve/reject)
│   │   │   ├── attendance.routes.js   # POST /check-in, /check-out, GET /my, GET /:employeeId
│   │   │   ├── salary.routes.js       # POST /:employeeId, GET /:employeeId/history, /current
│   │   │   ├── document.routes.js     # POST /:employeeId (upload), GET /:employeeId (list),
│   │   │   │                          #   GET /download/:id
│   │   │   └── audit.routes.js        # GET / — Admin-only audit log listing
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     # register, login, changePassword, forgotPassword, resetPassword
│   │   │   ├── employee.controller.js # create, list, getOne, getMyProfile, update, remove
│   │   │   ├── department.controller.js# create, list, getOne, update, remove
│   │   │   ├── leave.controller.js    # create, listAll, listMine, updateStatus
│   │   │   ├── attendance.controller.js# checkIn, checkOut, listMine, listForEmployee
│   │   │   ├── salary.controller.js   # create, history, current
│   │   │   ├── document.controller.js # upload, list, download
│   │   │   └── audit.controller.js    # list
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.js        # Business logic: passwords, tokens, password reset emails
│   │   │   ├── employee.service.js    # CRUD operations, profile lookups
│   │   │   ├── department.service.js  # CRUD operations
│   │   │   ├── leave.service.js       # Create requests, approve/reject, list with filters
│   │   │   ├── attendance.service.js  # Check-in/out, work-date records
│   │   │   ├── salary.service.js      # Add salary, get history, get current
│   │   │   ├── document.service.js    # Upload, list, download (file system storage)
│   │   │   └── audit.service.js       # Log actions, query logs
│   │   │
│   │   ├── validators/
│   │   │   ├── auth.validator.js      # Registration, login, password change, forgot/reset validation
│   │   │   ├── employee.validator.js  # Employee creation & ID param validation
│   │   │   ├── department.validator.js# Department name & ID param validation
│   │   │   ├── leave.validator.js     # Leave request dates & status update validation
│   │   │   ├── attendance.validator.js# Employee ID param validation
│   │   │   ├── salary.validator.js    # Amount, effective date & employee ID validation
│   │   │   └── document.validator.js  # Employee ID & document ID param validation
│   │   │
│   │   └── utils/
│   │       ├── jwt.js                 # JWT sign/verify helpers
│   │       ├── logger.js              # Winston logger configuration
│   │       ├── token.js               # Random token generation (password reset)
│   │       └── date.js                # Date formatting helpers
│   │
│   ├── tests/
│   │   ├── env.js                     # Test environment variable overrides
│   │   ├── helpers.js                 # Test utilities (login helper, etc.)
│   │   ├── setup.js                   # Jest global setup/teardown
│   │   ├── auth.test.js               # Auth endpoint tests (register, login, etc.)
│   │   └── leave.test.js              # Leave request endpoint tests
│   │
│   ├── uploads/                       # Uploaded document files (gitignored)
│   └── logs/                          # Winston log files (gitignored)
│
├── hr-platform-frontend/             # === React SPA (Vite + Tailwind CSS) ===
│   ├── package.json                   # Dependencies: react, react-router-dom, axios, recharts, lucide
│   ├── package-lock.json
│   ├── index.html                     # Vite entry HTML
│   ├── vite.config.js                 # Vite configuration (port 5173, React plugin)
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   ├── postcss.config.js              # PostCSS configuration (Tailwind + autoprefixer)
│   │
│   ├── Dockerfile                     # Multi-stage: build with node, serve with nginx:alpine
│   ├── nginx.conf                     # Nginx config — SPA fallback to index.html
│   ├── .dockerignore
│   ├── README.md                      # Frontend-specific setup instructions
│   │
│   ├── public/
│   │   └── favicon.svg                # App favicon
│   │
│   └── src/
│       ├── main.jsx                   # App entry — renders <App /> into DOM
│       ├── index.css                  # Global styles + Tailwind directives
│       ├── App.jsx                    # Root component — BrowserRouter, ToastProvider, AuthProvider,
│       │                              #   all route definitions with role-based ProtectedRoute
│       │
│       ├── context/
│       │   ├── AuthContext.jsx         # Auth state management — login/logout, user, token, role
│       │   └── ToastContext.jsx        # Toast notification state management
│       │
│       ├── hooks/
│       │   ├── useAuth.js             # Custom hook — consumes AuthContext
│       │   └── useToast.js            # Custom hook — consumes ToastContext
│       │
│       ├── services/
│       │   └── api.js                 # Axios instance with base URL, auth interceptor
│       │
│       ├── routes/
│       │   └── ProtectedRoute.jsx     # Route guard — checks auth + role, redirects to /login
│       │
│       ├── utils/
│       │   ├── greeting.js            # Time-based greeting helper
│       │   └── audit.js               # Audit logging helper
│       │
│       ├── components/
│       │   ├── common/
│       │   │   ├── Avatar.jsx         # User avatar component
│       │   │   ├── Button.jsx         # Reusable button component
│       │   │   ├── ConfirmDialog.jsx  # Confirmation modal dialog
│       │   │   ├── EmptyState.jsx     # Empty state placeholder
│       │   │   ├── Input.jsx          # Reusable form input component
│       │   │   ├── Layout.jsx         # Main app layout — sidebar, header, content area
│       │   │   ├── MetricCard.jsx     # Dashboard metric/stat card
│       │   │   ├── Skeleton.jsx       # Loading skeleton placeholders
│       │   │   └── UserMenu.jsx       # User dropdown menu (logout, profile)
│       │   └── employee/
│       │       └── .gitkeep           # Placeholder for employee-specific components
│       │
│       └── pages/
│           ├── Login.jsx              # Login page — email + password form
│           ├── AdminDashboard.jsx     # Admin dashboard — overview, stats, management links
│           ├── HRDashboard.jsx        # HR dashboard — overview, stats, approvals
│           ├── EmployeeDashboard.jsx  # Employee dashboard — personal stats, quick actions
│           ├── Employees.jsx          # Employee list & management (Admin/HR)
│           ├── Departments.jsx        # Department management (Admin)
│           ├── LeaveRequests.jsx      # Leave request management (all roles)
│           ├── Attendance.jsx         # Attendance tracking (all roles)
│           ├── Salary.jsx             # Salary view/history (all roles)
│           ├── Documents.jsx          # Document upload/view (all roles)
│           ├── AuditLogs.jsx          # Audit log viewer (Admin)
│           └── NotFound.jsx           # 404 page
│
└── (root-level configs)
```

---

## Database Schema Overview (Prisma)

| Model            | Key Fields                                      | Relationships                  |
| ---------------- | ----------------------------------------------- | ------------------------------ |
| **User**         | id, email (unique), passwordHash, role (enum)   | 1:1 → Employee, 1:N → AuditLog |
| **Department**   | id, name (unique)                               | 1:N → Employee                 |
| **Employee**     | id, userId (unique), departmentId, fullName     | N:1 → User, Department         |
| **Salary**       | id, employeeId, amount (Decimal), effectiveDate | N:1 → Employee                 |
| **LeaveRequest** | id, employeeId, startDate, endDate, status      | N:1 → Employee                 |
| **Attendance**   | id, employeeId, workDate (unique pair)          | N:1 → Employee                 |
| **Document**     | id, employeeId, filePath, fileName              | N:1 → Employee                 |
| **AuditLog**     | id, userId, action, metadata (JSON)             | N:1 → User                     |

## Role-Based Access Control

| Role         | Access Level                                                                   |
| ------------ | ------------------------------------------------------------------------------ |
| **ADMIN**    | Full access — manage departments, create HR/Employee accounts, view audit logs |
| **HR**       | Manage employees, salary records, leave approvals, attendance, documents       |
| **EMPLOYEE** | Self-service — view own profile, submit leave, check-in/out, view salary/docs  |

## API Endpoints Summary

```
POST   /api/auth/register           → Register new user (Admin only)
POST   /api/auth/login              → Login, returns JWT
PATCH  /api/auth/change-password    → Change own password (authenticated)
POST   /api/auth/forgot-password    → Request password reset email
POST   /api/auth/reset-password     → Reset password with token

POST   /api/employees               → Create employee (Admin/HR)
GET    /api/employees               → List all employees (Admin/HR)
GET    /api/employees/my            → Get own profile (authenticated)
GET    /api/employees/:id           → Get employee by ID (authenticated)
PUT    /api/employees/:id           → Update employee (Admin/HR)
DELETE /api/employees/:id           → Delete employee (Admin)

POST   /api/departments             → Create department (Admin)
GET    /api/departments             → List departments (authenticated)
GET    /api/departments/:id         → Get department (authenticated)
PUT    /api/departments/:id         → Update department (Admin)
DELETE /api/departments/:id         → Delete department (Admin)

POST   /api/leave-requests          → Submit leave (Employee)
GET    /api/leave-requests          → List all (Admin/HR)
GET    /api/leave-requests/my       → List own leaves (authenticated)
PATCH  /api/leave-requests/:id      → Approve/reject (Admin/HR)

POST   /api/attendance/check-in     → Check in (Employee)
POST   /api/attendance/check-out    → Check out (Employee)
GET    /api/attendance/my           → Own attendance (authenticated)
GET    /api/attendance/:employeeId  → Employee attendance (Admin/HR)

POST   /api/salaries/:employeeId    → Add salary record (Admin/HR)
GET    /api/salaries/:employeeId/history  → Salary history (authenticated)
GET    /api/salaries/:employeeId/current  → Current salary (authenticated)

POST   /api/documents/:employeeId   → Upload document (authenticated)
GET    /api/documents/:employeeId   → List documents (authenticated)
GET    /api/documents/download/:id  → Download document (authenticated)

GET    /api/audit-logs              → List audit logs (Admin)
GET    /health                      → Health check (public)
```

## CI/CD Pipeline (Jenkins)

```
┌────────────────────────────────────────────────────────────┐
│                    Jenkins Pipeline                         │
│                                                             │
│  1. Checkout                                                │
│  2. Secret Scan (GitLeaks)                                  │
│  3. Dependency Scan (OWASP)                                 │
│  4. Run Backend Tests (Docker Compose)                      │
│  5. Static Code Analysis (SonarQube)                        │
│  6. Build Docker Images (Backend + Frontend in parallel)    │
│  7. Container Vulnerability Scan (Trivy)                    │
└────────────────────────────────────────────────────────────┘
```

## Docker Services (Local Dev)

| Service    | Image/Context          | Port | Depends On |
| ---------- | ---------------------- | ---- | ---------- |
| PostgreSQL | postgres:16            | 5433 | —          |
| Backend    | ./hr-platform-backend  | 5000 | postgres   |
| Frontend   | ./hr-platform-frontend | 8090 | backend    |

## Key Design Decisions

- **JWT authentication** with bcrypt password hashing
- **Role-based + ownership-based authorization** (employees can only access own data)
- **Prisma ORM** with PostgreSQL for type-safe database access
- **Winston** for structured logging
- **express-validator** for request validation
- **Multer** for file uploads (disk storage to ./uploads/)
- **Nodemailer + Ethereal** for password reset emails in dev
- **Jest + Supertest** for API testing
- **Docker Compose** for reproducible local development
- **GitLeaks, OWASP Dependency-Check, SonarQube, Trivy** for CI security scanning
