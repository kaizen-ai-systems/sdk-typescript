export type TimeWindow = "1h" | "24h" | "7d" | "30d";
export type GroupByDimension = "project" | "model" | "team" | "provider" | "endpoint";
export type AlertType = "cost_threshold" | "cost_anomaly" | "usage_spike" | "idle_resource" | "budget_exceeded";

export interface EnzanSummaryRequest {
  window: TimeWindow;
  groupBy?: GroupByDimension[];
  filters?: { projects?: string[]; models?: string[]; teams?: string[]; providers?: string[]; endpoints?: string[] };
}

export interface EnzanModelCostRequest {
  window: TimeWindow;
}

export interface EnzanLLMPricingUpsertRequest {
  provider: string;
  model: string;
  displayName?: string;
  inputCostPer1KTokensUsd: number;
  outputCostPer1KTokensUsd: number;
  currency?: string;
  active?: boolean;
}

export interface EnzanGPUPricingUpsertRequest {
  provider: string;
  gpuType: string;
  displayName?: string;
  hourlyRateUsd: number;
  currency?: string;
  active?: boolean;
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
  avgUtilPct?: number;
}

export interface EnzanSummaryResponse {
  window: string;
  startTime: string;
  endTime: string;
  rows: EnzanSummaryRow[];
  total: { costUsd: number; gpuHours: number; requests: number; tokensIn: number; tokensOut: number };
  apiCosts?: APICostSummary;
}

export interface EnzanModelCategoryBreakdown {
  category: "simple" | "moderate" | "complex";
  queries: number;
  promptTokens: number;
  outputTokens: number;
  costUsd: number;
  percentage: number;
  avgCostPerQuery: number;
}

export interface EnzanModelCostRow {
  model: string;
  queries: number;
  promptTokens: number;
  outputTokens: number;
  costUsd: number;
  percentage: number;
  avgCostPerQuery: number;
  categories?: EnzanModelCategoryBreakdown[];
}

export interface EnzanModelCostResponse {
  window: string;
  startTime: string;
  endTime: string;
  rows: EnzanModelCostRow[];
  total: { queries: number; promptTokens: number; outputTokens: number; costUsd: number };
}

export interface EnzanLLMPricing {
  provider: string;
  model: string;
  displayName: string;
  inputCostPer1KTokensUsd: number;
  outputCostPer1KTokensUsd: number;
  currency: string;
  active: boolean;
}

export interface EnzanGPUPricing {
  provider: string;
  gpuType: string;
  displayName: string;
  hourlyRateUsd: number;
  currency: string;
  active: boolean;
}

export interface EnzanLLMPricingMutationResponse {
  status: string;
  pricing: EnzanLLMPricing;
}

export interface EnzanGPUPricingMutationResponse {
  status: string;
  pricing: EnzanGPUPricing;
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
  endpoint?: string;
  labels?: Record<string, string>;
  hourlyRate: number;
  createdAt?: string;
  lastSeenAt?: string;
}

export interface EnzanAlert {
  id: string;
  name: string;
  type: AlertType;
  threshold: number;
  window: string;
  labels?: Record<string, string>;
  enabled: boolean;
}

export interface EnzanBurnResponse {
  burnRateUsdPerHour: number;
  timestamp: string;
}

export type EnzanRecommendationType =
  | "model_downgrade"
  | "duplicate_caching"
  | "self_host_breakeven"
  | "spend_anomaly"
  | "price_arbitrage";

export interface EnzanOptimizeRequest {
  window?: TimeWindow;
}

export interface EnzanRecommendation {
  type: EnzanRecommendationType;
  title: string;
  description: string;
  estimatedSavings: number;
  confidence: number;
  suggestion: string;
}

export interface EnzanOptimizeResponse {
  window: string;
  startTime: string;
  endTime: string;
  efficiencyScore: number;
  monthlySpend: number;
  potentialSavings: number;
  recommendations: EnzanRecommendation[];
}

// ─── Chat types ──────────────────────────────────────────────────────────────

export interface EnzanChatRequest {
  message: string;
  conversationId?: string;
  window?: TimeWindow;
}

export type EnzanSuggestedAction =
  | { type: "set_window"; label: string; window: TimeWindow }
  | { type: "view_summary"; label: string; window: TimeWindow }
  | {
      type: "view_costs_by_model";
      label: string;
      window: TimeWindow;
      model?: string;
    }
  | { type: "view_optimizer"; label: string; window: TimeWindow }
  | { type: "view_model_pricing"; label: string }
  | { type: "view_gpu_pricing"; label: string };

export interface EnzanChatResponse {
  conversationId: string;
  message: string;
  effectiveWindow?: TimeWindow;
  suggestedActions: EnzanSuggestedAction[];
  supportingData?: Record<string, unknown>;
}
