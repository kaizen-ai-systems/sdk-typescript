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
