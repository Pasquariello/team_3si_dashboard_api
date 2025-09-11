import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Load .env.test
const envPath = resolve(__dirname, ".env.test");
if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split("\n")) {
    if (!line || line.startsWith("#"))
      continue;
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] ?? "";
      value = value.replace(/^['"]|['"]$/g, "");
      // eslint-disable-next-line node/no-process-env
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
