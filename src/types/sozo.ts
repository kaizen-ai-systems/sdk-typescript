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
  nullCount: number;
  min?: number;
  max?: number;
  mean?: number;
  stdDev?: number;
}

export interface SozoGenerateResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  stats: Record<string, SozoColumnStats>;
}

export interface SozoSchemaInfo {
  name: string;
  description?: string;
  columns: SozoSchema;
}
