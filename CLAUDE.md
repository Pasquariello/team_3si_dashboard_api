# Project Documentation for Claude

## 1. Tech Stack
- **Framework**: Express.js v5.1.0
- **Runtime**: Node.js (ESNext target)
- **Build Tool**: TypeScript v5.8.3
- **TypeScript**: Strict mode enabled
- **Test Runner**: Vitest v3.2.4
- **Key Dependencies**: 
  - @databricks/sql v1.11.0 (database client)
  - zod v3.25.67 (validation)
  - jsonwebtoken v9.0.2 (auth)
  - sql-template-strings v2.2.2 (SQL templating)

## 2. Project Structure
```
./src/
  app.ts                    # Express app configuration
  index.ts                  # Server entry point
  env.ts                    # Environment validation
  config/
    databricks.ts          # Database client
  controllers/             # Request handlers
    providerData.ts
    providerInsights.ts
    providerScenario.ts
  routes/                  # Route definitions
    login.ts
    providerData.ts
    providerScenario.ts
  queryBuilders/           # SQL query builders
    providerDetails.ts
    providerMonthly.ts
    providerYearly.ts
    scenarioQueries/
      billedOverCapacity.ts
      distanceTraveled.ts
      overallScore.ts
      placedOverCapacity.ts
      sameAddress.ts
  services/
    queryService.ts
  interfaces/
    errorResponse.ts
    messageResponse.ts
  middlewares.ts

./test/                    # All tests in test directory
  api.test.ts
  app.test.ts
  checkedFilter.test.ts
  login.test.ts
  providerData.test.ts
  providerInsights.test.ts
  providerScenario.test.ts
```

## 3. Testing

**Test Runner**: Vitest with globals enabled

**Import Pattern** (from real test files):
```typescript
// test/api.test.ts
import request from "supertest";
import { describe, it } from "vitest";

import app from "../src/app.js";
```

```typescript
// test/providerInsights.test.ts
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../src/app.js";
```

**Test File Location Pattern**:
```
Source: src/controllers/providerData.ts
Test:   test/providerData.test.ts
```

**Naming Convention**: `*.test.ts`

**Mock Pattern**:
```typescript
// test/providerInsights.test.ts
const mockGetProviderDataInsights = vi.hoisted(() => vi.fn());
const mockUpdateProviderDataInsights = vi.hoisted(() => vi.fn());

vi.mock("../src/controllers/providerInsights.js", () => ({
  getProviderDataInsights: mockGetProviderDataInsights,
  updateProviderDataInsights: mockUpdateProviderDataInsights,
}));

vi.mock("../src/middlewares.js", () => ({
  authenticateJWT: vi.fn((req, res, next) => next()),
  notFound: vi.fn(),
  errorHandler: vi.fn()
}));
```

**Test Structure Pattern**:
```typescript
// test/app.test.ts
describe("app", () => {
  it("responds with a not found message", () =>
    request(app)
      .get("/what-is-this-even")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(404));
});

describe("GET /", () => {
  it("responds with a json message", () =>
    request(app)
      .get("/")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200, {
        message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
      }));
});
```

## 4. Import Conventions

**File Extension Required**: All imports MUST include `.js` extension
```typescript
// src/app.ts
import * as middlewares from "./middlewares.js";
import login from "./routes/login.js";
import providerData from "./routes/providerData.js";
import providerScenario from "./routes/providerScenario.js";
```

**Node Built-ins**: Use `node:` prefix
```typescript
// src/index.ts
import http from "node:http";

// vitest.config.ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
```

**Type-Only Imports**:
```typescript
// src/controllers/providerScenario.ts
import type express from "express";

// src/middlewares.ts
import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
```

**Relative Imports**: Always use relative paths (no path aliases configured)
```typescript
// src/config/databricks.ts
import { env } from "../env.js";

// src/controllers/providerData.ts
import { buildProviderDetailsQuery } from "../queryBuilders/providerDetails.js";
```

## 5. Export Conventions

**Named Exports** (predominant pattern):
```typescript
// src/middlewares.ts
export function notFound(req: Request, res: Response, next: NextFunction) {
export function errorHandler(err: Error, req: Request, res: Response<ErrorResponse>, _next: NextFunction) {
export function authenticateJWT(

// src/queryBuilders/providerYearly.ts
export function buildProviderYearlyQuery({ year, offset, isFlagged, cities }: BuildProviderYearlyQueryParams) {

// src/env.ts
export const env = envSchema.parse(process.env);
```

**Default Exports** (limited to main app, routes, and interfaces):
```typescript
// src/app.ts
export default app;

// src/routes/login.ts
export default router;

// src/interfaces/errorResponse.ts
export default ErrorResponse;
```

**Type Exports**:
```typescript
// src/controllers/providerScenario.ts
export type ScenarioPlacedOverData = {
export type PlacedOverWeek = {
export type UiScenarioMainRows = {

// src/controllers/providerData.ts
export type MonthlyProviderData = {
export type UiMonthlyProviderData = {
export type AnnualProviderData = {
```

## 6. Function and Async Patterns

**Async Functions with Explicit Return Types**:
```typescript
// src/config/databricks.ts
export async function getDatabricksClient(): Promise<DBSQLClient> {
  if (!client) {
    client = new DBSQLClient();
    await client.connect({
      host: env.DATABRICKS_HOST!,
      path: env.DATABRICKS_HTTP_PATH!,
      token: env.PAT_TOKEN!,
    });
    console.log("Databricks client connected");
  }
  return client;
}
```

**Express Route Handlers**:
```typescript
// src/controllers/providerInsights.ts
export async function updateProviderDataInsights(req: express.Request, res: express.Response) {

export async function getProviderDataInsights(req: express.Request, res: express.Response) {

// src/controllers/providerData.ts
export async function exportProviderDataMonthly(req: express.Request, res: express.Response) {

export async function exportProviderDataYearly(req: express.Request, res: express.Response) {
```

**Synchronous Functions with Parameters**:
```typescript
// src/queryBuilders/providerMonthly.ts
export function checkedFilter(filterOptions: { flagged: boolean, unflagged: boolean }): boolean | null {

export function parseMonthParam(monthParam: string) {

// src/controllers/providerScenario.ts
export function reducePlacedOverWeeks(weeks?: PlacedOverWeek[]): Pick<UiScenarioMainRows, "aveWklyPlacements" | "closeTime" | "openTime"> {

export function parsePlacedOverWeeks(weeks: PlacedOverWeek[]): UiScenarioSubRows[] {
```

## 7. Framework-Specific Conventions

**Express App Setup**:
```typescript
// src/app.ts
const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get<object, MessageResponse>("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

app.use("/api/v1", login);
app.use("/api/v1/providerData", providerData);
app.use("/api/v1/scenario", providerScenario)

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);
```

**Express Router Pattern**:
```typescript
// src/routes/providerScenario.ts
import { Router } from "express";

// src/routes/providerData.ts
import { Router } from "express";
```

**SQL Template Strings Usage**:
```typescript
// src/queryBuilders/providerYearly.ts
import { SQL } from "sql-template-strings";

// src/queryBuilders/providerDetails.ts
import SQL from "sql-template-strings";

// src/controllers/providerData.ts
import SQL from "sql-template-strings";
```

**Zod Environment Validation**:
```typescript
// src/env.ts
import { z } from "zod/v4";

export const env = envSchema.parse(process.env);
```

## 8. Critical Notes for Code Generation

1. **File Extensions Are Mandatory**: Every import must include `.js` extension, even when importing TypeScript files
   ```typescript
   // WRONG
   import app from "./app";
   
   // RIGHT
   import app from "./app.js";
   ```

2. **Type Definitions**: Use `type` not `interface` per linter config
   ```typescript
   // Per eslint rule "ts/consistent-type-definitions": ["error", "type"]
   export type MonthlyProviderData = {
   ```

3. **No Path Aliases**: Project uses relative imports only, no `@/` or other aliases configured

4. **Environment Variables**: Access through validated `env` object, not `process.env` directly
   ```typescript
   // src/config/databricks.ts
   import { env } from "../env.js";
   // Use: env.DATABRICKS_HOST
   ```

5. **Test File Placement**: All tests go in `./test/` directory, not co-located with source

6. **Vitest Globals**: Tests can use `describe`, `it`, `expect` without imports when needed due to globals: true config

7. **Express TypeScript Pattern**: Import express types as `type express` to avoid conflicts
   ```typescript
   import type express from "express";
   ```

8. **Non-Null Assertions**: Project uses `!` for required env vars
   ```typescript
   host: env.DATABRICKS_HOST!,
   ```
