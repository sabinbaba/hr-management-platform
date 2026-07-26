# Task: Fix test failures (DATABASE_URL not found)

## Steps:

1. [x] Create `hr_platform_test` database in PostgreSQL container
2. [x] Fix `.env.test` - update port from `5432` to `5433`
3. [x] Run Prisma migrations on the test database
4. [x] Run `npm test` to verify all tests pass

---

**Status: ✅ COMPLETE**

All 11 tests pass (auth + leave). The `!` in the password requires single-quoting the `DATABASE_URL` when running commands manually in zsh:

```bash
DATABASE_URL='postgresql://hr_admin:HrPlatform2026!@localhost:5433/hr_platform_test' npx jest
```
