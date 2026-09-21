import { disconnectDatabase, prisma } from "../config/database.js";

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("PostgreSQL connection successful.");
  } catch (error) {
    console.error("PostgreSQL connection failed. Check DATABASE_URL and confirm PostgreSQL is running.");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

void checkDatabase();
