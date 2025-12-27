import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "postgresql://learnbox_user:learnbox_user@localhost:5432/learnbox_db?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
