# Enterprise HR Management Platform

A full-stack HR management system built with React, Node.js/Express, PostgreSQL,
and Prisma ORM — featuring role-based authentication, employee lifecycle management,
leave/attendance tracking, salary history, document uploads, and audit logging.

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Prisma ORM, JWT auth, bcrypt, Multer, Nodemailer, Winston
**Frontend:** React, React Router, Tailwind CSS, Axios, Recharts, Lucide icons
**DevOps:** Docker, Docker Compose (Jenkins, Kubernetes, Terraform, Ansible, monitoring to follow)

## Project Structure

- `hr-platform-backend/` — REST API (Express + Prisma + PostgreSQL)
- `hr-platform-frontend/` — React SPA (Vite + Tailwind CSS)
- `docker-compose.yml` — orchestrates backend, frontend, and PostgreSQL containers together

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

## Running Locally

### Option 1: Docker Compose (recommended)

```bash
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

Frontend: http://localhost:8090
Backend API: http://localhost:5000/api

### Option 2: Manual (without Docker)

See `hr-platform-backend/README.md` and `hr-platform-frontend/README.md` for
individual setup instructions (Node.js, PostgreSQL, environment variables).

## Status

Backend, frontend, and Docker containerization are complete and fully tested.
CI/CD, infrastructure-as-code, Kubernetes, and monitoring are in progress.
