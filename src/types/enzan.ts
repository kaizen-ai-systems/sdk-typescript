export type TimeWindow = "1h" | "24h" | "7d" | "30d";
export type GroupByDimension = "project" | "model" | "team" | "provider" | "endpoint";
export type AlertType = "cost_threshold" | "cost_anomaly" | "usage_spike" | "idle_resource" | "budget_exceeded";

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
  endpoint?: string;
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
  apiCosts?: APICostSummary;
}

export interface APICostSummary {
  totalCostUsd: number;
  promptTokens: number;
  outputTokens: number;
  queries: number;
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

export interface EnzanBurnResponse {
  burnRateUsdPerHour: number;
  timestamp: string;
}
