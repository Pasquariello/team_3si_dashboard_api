/* eslint-disable node/no-process-env */
import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  PAT_TOKEN: z.string().nonempty(),

  DATABRICKS_HOST: z.string().nonempty(),
  DATABRICKS_HTTP_PATH: z.string().nonempty(),
  JWT_SECRET: z.string().nonempty(),
});

try {
  envSchema.parse(process.env);
}
catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Missing environment variables:", error.issues.flatMap(issue => issue.path));
  }
  else {
    console.error(error);
  }
  process.exit(1);
}

export const env = envSchema.parse(process.env);
