import { z } from "zod";

const DEV_JWT_SECRET = "dev-jwt-secret-for-local";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars").default(DEV_JWT_SECRET),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  STORAGE_DIR: z.string().default("./storage"),
});

export const env = schema.parse({
  ...process.env,
  JWT_SECRET: process.env.JWT_SECRET ?? DEV_JWT_SECRET,
});
