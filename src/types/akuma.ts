export type SQLDialect = "postgres" | "mysql" | "snowflake" | "bigquery";

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

export interface AkumaColumn {
  name: string;
  type: string;
  nullable?: boolean;
  description?: string;
  examples?: string[];
}

export interface AkumaForeignKey {
  columns: string[];
  refTable: string;
  refColumns: string[];
}

export interface AkumaTable {
  name: string;
  description?: string;
  columns: AkumaColumn[];
  primaryKey?: string[];
  foreignKeys?: AkumaForeignKey[];
}

export interface AkumaSchemaRequest {
  version?: string;
  tables: AkumaTable[];
}

export interface AkumaSchemaResponse {
  status: string;
  tables: number;
}
