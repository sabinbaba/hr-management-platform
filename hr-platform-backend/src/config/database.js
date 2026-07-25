// Configures and exports the PostgreSQL/Prisma database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;