# @kaizen/sdk

Official TypeScript/JavaScript SDK for [Kaizen AI Systems](https://www.kaizenaisystems.com).

## Installation

```bash
npm install @kaizen/sdk
```

## Quick Start

```typescript
import { akuma, enzan, sozo, setApiKey } from "@kaizen/sdk";

setApiKey("your-api-key");

// Akuma: Natural Language → SQL
const { sql, rows } = await akuma.query({
  dialect: "postgres",
  prompt: "Top 10 customers by MRR last month",
  mode: "sql-and-results",
  guardrails: { readOnly: true }
});

// Enzan: GPU Cost Summary
const summary = await enzan.summary({
  window: "24h",
  groupBy: ["project", "model"]
});

// Sōzō: Synthetic Data
const data = await sozo.generate({
  schemaName: "saas_customers_v1",
  records: 10000
});
```

## Akuma (NL→SQL)

```typescript
// Generate SQL from natural language
const { sql, rows, explanation } = await akuma.query({
  dialect: "postgres",  // postgres, mysql, snowflake, bigquery, sqlite
  prompt: "Show revenue by month for 2024",
  mode: "sql-and-results",  // sql-only, sql-and-results, explain
  guardrails: {
    readOnly: true,
    allowTables: ["orders", "customers"],
    denyColumns: ["ssn", "password"],
    maxRows: 1000
  }
});

// Explain a SQL query
const { explanation } = await akuma.explain("SELECT * FROM users WHERE active = true");
```

## Enzan (GPU Cost)

```typescript
// Get cost summary
const summary = await enzan.summary({
  window: "24h",  // 1h, 24h, 7d, 30d
  groupBy: ["project", "model"],
  filters: { projects: ["fraud-api"] }
});
console.log(summary.total.costUsd);

// Get burn rate
const { burnRateUsdPerHour } = await enzan.burn();

// Register GPU resource
await enzan.registerResource({
  id: "gpu-001",
  provider: "aws",
  gpuType: "a100_80gb",
  gpuCount: 8,
  hourlyRate: 32.77,
  labels: { project: "ml-training" }
});

// Create alert
await enzan.createAlert({
  id: "alert-001",
  name: "High spend",
  type: "cost_threshold",
  threshold: 1000,
  window: "24h",
  enabled: true
});
```

## Sōzō (Synthetic Data)

```typescript
// Generate with predefined schema
const data = await sozo.generate({
  schemaName: "saas_customers_v1",
  records: 10000
});

// Generate with custom schema
const data = await sozo.generate({
  schema: {
    user_id: "uuid4",
    email: "email",
    plan: "choice:free,pro,enterprise",
    mrr: "float:0-500",
    churned: "boolean:0.15"
  },
  records: 5000,
  correlations: { "plan:mrr": "positive" },
  seed: 42
});

// Export formats
const csv = sozo.toCSV(data);
const jsonl = sozo.toJSONL(data);

// List schemas
const schemas = await sozo.listSchemas();
```

### Built-in `schemaName` values

| Name | Description |
| --- | --- |
| `saas_customers_v1` | SaaS accounts with plan, seats, MRR, and churn signals |
| `ecommerce_orders_v1` | Ecommerce orders with channel, status, totals, and timestamps |
| `users_v1` | Generic SaaS user directory with contact + lifecycle fields |

Call `sozo.listSchemas()` to read the full column definitions at runtime.

### Schema DSL

| Type | Example | Description |
|------|---------|-------------|
| `uuid4` | `"uuid4"` | UUID v4 |
| `email` | `"email"` | Random email |
| `name` | `"name"` | Person name |
| `choice` | `"choice:a,b,c"` | Random choice |
| `float` | `"float:0-500"` | Float range |
| `int` | `"int:1-100"` | Integer range |
| `boolean` | `"boolean:0.18"` | With probability |
| `datetime` | `"datetime:past-2y"` | Datetime range |

## Configuration

```typescript
import { createClient } from "@kaizen/sdk";

const client = createClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.kaizenaisystems.com",
  timeout: 30000
});
```

## Error Handling

```typescript
import { KaizenError, KaizenAuthError, KaizenRateLimitError } from "@kaizen/sdk";

try {
  await akuma.query({ ... });
} catch (e) {
  if (e instanceof KaizenAuthError) console.error("Invalid API key");
  if (e instanceof KaizenRateLimitError) console.error("Rate limited");
  if (e instanceof KaizenError) console.error(e.message, e.status);
}
```

## License

MIT © Kaizen AI Systems
