// @kaizen/sdk - Official TypeScript SDK for Kaizen AI Systems
// Products: Akuma (NL→SQL) | Enzan (GPU Cost) | Sōzō (Synthetic Data)

// ============================================================================
// TYPES - AKUMA (NL→SQL)
// ============================================================================

export type SQLDialect = "postgres" | "mysql" | "snowflake" | "bigquery" | "sqlite" | "redshift" | "clickhouse";
export type QueryMode = "sql-only" | "sql-and-results" | "explain";

export interface Guardrails {
  readOnly?: boolean;
  allowTables?: string[];
  denyTables?: string[];
  denyColumns?: string[];
  maxRows?: number;
  timeoutSecs?: number;
}

export interface AkumaQueryRequest {
  dialect: SQLDialect;
  prompt: string;
  mode?: QueryMode;
  maxRows?: number;
  guardrails?: Guardrails;
}

export interface AkumaQueryResponse {
  sql: string;
  rows?: Record<string, unknown>[];
  explanation?: string;
  tables?: string[];
  warnings?: string[];
  error?: string;
}

export interface AkumaExplainResponse {
  sql: string;
  explanation: string;
}

// ============================================================================
// TYPES - ENZAN (GPU Cost)
// ============================================================================

export type TimeWindow = "1h" | "24h" | "7d" | "30d";
export type GroupByDimension = "project" | "model" | "team" | "provider" | "endpoint";
export type AlertType = "cost_threshold" | "usage_spike" | "idle_resource" | "budget_exceeded";

export interface EnzanSummaryRequest {
  window: TimeWindow;
  groupBy?: GroupByDimension[];
  filters?: { projects?: string[]; models?: string[]; teams?: string[]; providers?: string[] };
}

export interface EnzanSummaryRow {
  project?: string;
  model?: string;
  team?: string;
  provider?: string;
  costUsd: number;
  gpuHours: number;
  requests: number;
  tokensIn: number;
  tokensOut: number;
}

export interface EnzanSummaryResponse {
  window: string;
  startTime: string;
  endTime: string;
  rows: EnzanSummaryRow[];
  total: { costUsd: number; gpuHours: number; requests: number };
}

export interface EnzanResource {
  id: string;
  provider: string;
  gpuType: string;
  gpuCount: number;
  region?: string;
  labels?: Record<string, string>;
  hourlyRate: number;
}

export interface EnzanAlert {
  id: string;
  name: string;
  type: AlertType;
  threshold: number;
  window: string;
  enabled: boolean;
}

// ============================================================================
// TYPES - SŌZŌ (Synthetic Data)
// ============================================================================

export type SozoSchema = Record<string, string>;
export type CorrelationType = "positive" | "negative";

export interface SozoGenerateRequest {
  schema?: SozoSchema;
  schemaName?: string;
  records: number;
  correlations?: Record<string, CorrelationType>;
  seed?: number;
}

export interface SozoColumnStats {
  type: string;
  min?: number;
  max?: number;
  mean?: number;
  uniqueCount?: number;
  values?: Record<string, number>;
}

export interface SozoGenerateResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  stats: Record<string, SozoColumnStats>;
}

export interface SozoSchemaInfo {
  name: string;
  columns: SozoSchema;
}

// ============================================================================
// CONFIG & ERRORS
// ============================================================================

export interface KaizenConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export class KaizenError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "KaizenError";
  }
}

export class KaizenAuthError extends KaizenError {
  constructor(message = "Invalid or missing API key") {
    super(message, 401, "AUTH_ERROR");
  }
}

export class KaizenRateLimitError extends KaizenError {
  constructor(message = "Rate limit exceeded", public retryAfter?: number) {
    super(message, 429, "RATE_LIMIT");
  }
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: KaizenConfig = {}) {
    this.baseUrl = config.baseUrl || "https://api.kaizenaisystems.com";
    this.apiKey = config.apiKey || "";
    this.timeout = config.timeout || 30000;
  }

  setApiKey(key: string) { this.apiKey = key; }
  setBaseUrl(url: string) { this.baseUrl = url; }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new KaizenAuthError(data.error);
        if (res.status === 429) throw new KaizenRateLimitError(data.error);
        throw new KaizenError(data.error || "Request failed", res.status);
      }
      return data;
    } catch (e) {
      clearTimeout(tid);
      if (e instanceof KaizenError) throw e;
      throw new KaizenError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  get<T>(path: string) { return this.request<T>("GET", path); }
  post<T>(path: string, body: unknown) { return this.request<T>("POST", path, body); }
}

// ============================================================================
// AKUMA CLIENT
// ============================================================================

export class AkumaClient {
  constructor(private http: HttpClient) {}

  /** Translate natural language to SQL */
  async query(req: AkumaQueryRequest): Promise<AkumaQueryResponse> {
    return this.http.post("/v1/akuma/query", req);
  }

  /** Explain a SQL query in plain English */
  async explain(sql: string): Promise<AkumaExplainResponse> {
    return this.http.post("/v1/akuma/explain", { sql });
  }
}

// ============================================================================
// ENZAN CLIENT
// ============================================================================

export class EnzanClient {
  constructor(private http: HttpClient) {}

  /** Get GPU cost summary */
  async summary(req: EnzanSummaryRequest): Promise<EnzanSummaryResponse> {
    return this.http.post("/v1/enzan/summary", req);
  }

  /** Get current burn rate */
  async burn(): Promise<{ burnRateUsdPerHour: number; timestamp: string }> {
    const r = await this.http.get<{ burn_rate_usd_per_hour: number; timestamp: string }>("/v1/enzan/burn");
    return { burnRateUsdPerHour: r.burn_rate_usd_per_hour, timestamp: r.timestamp };
  }

  /** List GPU resources */
  async listResources(): Promise<EnzanResource[]> {
    return (await this.http.get<{ resources: EnzanResource[] }>("/v1/enzan/resources")).resources;
  }

  /** Register a GPU resource */
  async registerResource(resource: EnzanResource): Promise<{ status: string; id: string }> {
    return this.http.post("/v1/enzan/resources", resource);
  }

  /** List alerts */
  async listAlerts(): Promise<EnzanAlert[]> {
    return (await this.http.get<{ alerts: EnzanAlert[] }>("/v1/enzan/alerts")).alerts;
  }

  /** Create an alert */
  async createAlert(alert: EnzanAlert): Promise<{ status: string; id: string }> {
    return this.http.post("/v1/enzan/alerts", alert);
  }
}

// ============================================================================
// SŌZŌ CLIENT
// ============================================================================

export class SozoClient {
  constructor(private http: HttpClient) {}

  /** Generate synthetic data */
  async generate(req: SozoGenerateRequest): Promise<SozoGenerateResponse> {
    return this.http.post("/v1/sozo/generate", req);
  }

  /** List predefined schemas */
  async listSchemas(): Promise<SozoSchemaInfo[]> {
    return (await this.http.get<{ schemas: SozoSchemaInfo[] }>("/v1/sozo/schemas")).schemas;
  }

  /** Convert to CSV */
  toCSV(res: SozoGenerateResponse): string {
    const esc = (v: unknown) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [res.columns.join(","), ...res.rows.map(r => res.columns.map(c => esc(r[c])).join(","))].join("\n");
  }

  /** Convert to JSONL */
  toJSONL(res: SozoGenerateResponse): string {
    return res.rows.map(r => JSON.stringify(r)).join("\n");
  }
}

// ============================================================================
// MAIN CLIENT
// ============================================================================

export class KaizenClient {
  private http: HttpClient;
  public readonly akuma: AkumaClient;
  public readonly enzan: EnzanClient;
  public readonly sozo: SozoClient;

  constructor(config: KaizenConfig = {}) {
    this.http = new HttpClient(config);
    this.akuma = new AkumaClient(this.http);
    this.enzan = new EnzanClient(this.http);
    this.sozo = new SozoClient(this.http);
  }

  setApiKey(key: string) { this.http.setApiKey(key); }
  setBaseUrl(url: string) { this.http.setBaseUrl(url); }
  async health() { return this.http.get<{ status: string; version: string; products: string[] }>("/health"); }
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

const defaultClient = new KaizenClient();
export const akuma = defaultClient.akuma;
export const enzan = defaultClient.enzan;
export const sozo = defaultClient.sozo;
export function setApiKey(key: string) { defaultClient.setApiKey(key); }
export function setBaseUrl(url: string) { defaultClient.setBaseUrl(url); }
export function createClient(config: KaizenConfig) { return new KaizenClient(config); }
export default defaultClient;
