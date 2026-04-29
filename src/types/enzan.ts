export type TimeWindow = "1h" | "24h" | "7d" | "30d";
export type GroupByDimension = "project" | "model" | "team" | "provider" | "endpoint";
export type AlertType =
  | "cost_threshold"
  | "cost_anomaly"
  | "usage_spike"
  | "idle_resource"
  | "budget_exceeded"
  | "optimization_available"
  | "pricing_change"
  | "daily_summary";

export type CreatableAlertType =
  | "cost_threshold"
  | "cost_anomaly"
  | "budget_exceeded"
  | "optimization_available"
  | "pricing_change"
  | "daily_summary";

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

export interface EnzanRoutingConfig {
  enabled: boolean;
  provider: string;
  defaultModel: string;
  simpleModel?: string;
  moderateModel?: string;
  complexModel?: string;
  updatedAt?: string;
}

export interface EnzanRoutingConfigUpsertRequest {
  enabled: boolean;
  simpleModel?: string;
  moderateModel?: string;
  complexModel?: string;
}

export interface EnzanRoutingConfigMutationResponse {
  status: string;
  routing: EnzanRoutingConfig;
}

export interface EnzanRoutingSavingsBreakdown {
  promptCategory: string;
  originalModel: string;
  routedModel: string;
  queries: number;
  actualCostUsd: number;
  counterfactualCostUsd: number;
  estimatedSavingsUsd: number;
}

export interface EnzanRoutingSavingsResponse {
  window: string;
  startTime: string;
  endTime: string;
  provider: string;
  defaultModel: string;
  totalQueries: number;
  routedQueries: number;
  actualCostUsd: number;
  counterfactualCostUsd: number;
  estimatedSavingsUsd: number;
  breakdown: EnzanRoutingSavingsBreakdown[];
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

/**
 * Live-pricing enum aliases.
 *
 * These are typed as `string` rather than closed unions so server-side
 * contract drift (an unknown new enum value) reaches the caller as the
 * literal string the server returned, instead of being silently masked
 * by a type narrowing the SDK can't actually enforce. The documented
 * values are listed in JSDoc on each type.
 *
 * Per `sdks/SDK_CONTRACT.md`: "status strings in response/error bodies
 * are surfaced verbatim by every SDK — no client-side coercion to known
 * enum values."
 */
/** Documented values: "on_demand" | "reserved" | "spot" | "committed_monthly". */
export type EnzanGPUDeploymentClass = string;
/** Documented values: "standard" | "high_speed" | "infiniband" | "nvlink" | "unknown". */
export type EnzanGPUInterconnectClass = string;
/** Documented values: "admin" | "api" | "adapter". */
export type EnzanPricingSourceType = string;
/** Documented values: "verified" | "unverified" | "suspect". */
export type EnzanPricingTrustStatus = string;
/** Documented values: "success" | "partial" | "timeout" | "failed" | "skipped_fresh". */
export type EnzanPricingRefreshStatus = string;
/** Documented values: "scheduled" | "on_demand". */
export type EnzanPricingRefreshKind = string;
/** Documented values: "api" | "adapter" | "manual". */
export type EnzanPricingProviderKind = string;

export interface EnzanPricingRefreshTriggerResponse {
  /** Documented values: "queued" (HTTP 202) or "dropped" (HTTP 429). Surfaced as `string` so unexpected values from server contract drift reach the caller instead of being silently coerced. */
  status: string;
  triggeredBy: string;
}

export interface EnzanPricingRefreshLogEntry {
  id: string;
  /** Server returns null (not omitted) when the originating source row was deleted (ON DELETE SET NULL). Type allows null and undefined so explicit-null payloads decode without normalization. */
  sourceId?: string | null;
  sourceName?: string | null;
  kind: EnzanPricingRefreshKind;
  triggeredBy?: string | null;
  status: EnzanPricingRefreshStatus;
  rowsUpserted: number;
  rowsSkipped: number;
  durationMs?: number | null;
  error?: string | null;
  startedAt: string;
  finishedAt?: string | null;
}

export interface EnzanPricingProvider {
  id: string;
  name: string;
  kind: EnzanPricingProviderKind;
  enabled: boolean;
  refreshIntervalHours: number;
  hasAdapter: boolean;
  /** Optional in OpenAPI; absent when the source has never run successfully. */
  lastSuccessAt?: string | null;
  lastFailureAt?: string | null;
  lastError?: string | null;
}

export interface EnzanGPUOfferUpsertPayload {
  provider: string;
  gpuType: string;
  displayName: string;
  region?: string;
  deploymentClass?: EnzanGPUDeploymentClass;
  commitmentTerm?: string;
  clusterSizeMin?: number;
  clusterSizeMax?: number;
  interconnectClass?: EnzanGPUInterconnectClass;
  trainingReady?: boolean;
  hourlyRateUSD: number;
  currency?: string;
  currencyFxNote?: string;
  sourceUrl?: string;
}

export interface EnzanLLMOfferUpsertPayload {
  provider: string;
  model: string;
  displayName: string;
  region?: string;
  commitmentTerm?: string;
  inputCostPer1KTokensUSD: number;
  outputCostPer1KTokensUSD: number;
  currency?: string;
  currencyFxNote?: string;
  sourceUrl?: string;
}

export interface EnzanPricingOfferUpsertRequest {
  gpu?: EnzanGPUOfferUpsertPayload;
  llm?: EnzanLLMOfferUpsertPayload;
}

export interface EnzanGPUOffer {
  id: string;
  provider: string;
  gpuType: string;
  displayName: string;
  region?: string | null;
  deploymentClass: EnzanGPUDeploymentClass;
  commitmentTerm?: string | null;
  clusterSizeMin: number;
  clusterSizeMax?: number | null;
  interconnectClass: EnzanGPUInterconnectClass;
  trainingReady: boolean;
  hourlyRateUSD: number;
  currency: string;
  currencyFxNote?: string | null;
  sourceType: EnzanPricingSourceType;
  sourceId?: string | null;
  sourceUrl?: string | null;
  sourceFingerprint?: string | null;
  trustStatus: EnzanPricingTrustStatus;
  fetchedAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  active: boolean;
}

export interface EnzanLLMOffer {
  id: string;
  provider: string;
  model: string;
  displayName: string;
  region?: string | null;
  commitmentTerm?: string | null;
  inputCostPer1KTokensUSD: number;
  outputCostPer1KTokensUSD: number;
  currency: string;
  currencyFxNote?: string | null;
  sourceType: EnzanPricingSourceType;
  sourceId?: string | null;
  sourceUrl?: string | null;
  sourceFingerprint?: string | null;
  trustStatus: EnzanPricingTrustStatus;
  fetchedAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  active: boolean;
}

export interface EnzanPricingOfferUpsertResponse {
  /** Documented values: "upserted" (HTTP 201) or "stale" (HTTP 409). Surfaced as `string` so unexpected values from server contract drift reach the caller. */
  status: string;
  gpu?: EnzanGPUOffer;
  llm?: EnzanLLMOffer;
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
  evaluationState?: "active" | "warming_up" | "waiting_for_data";
  nextEligibleAt?: string;
  statusReason?: string;
}

interface EnzanCreateAlertRequestBase {
  id?: string;
  name: string;
  labels?: Record<string, string>;
  enabled?: boolean;
}

export interface EnzanCreateCostThresholdAlertRequest extends EnzanCreateAlertRequestBase {
  type: "cost_threshold";
  threshold: number;
  window: TimeWindow;
}

export interface EnzanCreateCostAnomalyAlertRequest extends EnzanCreateAlertRequestBase {
  type: "cost_anomaly";
  threshold: number;
  window: Exclude<TimeWindow, "1h">;
}

export interface EnzanCreateBudgetExceededAlertRequest extends EnzanCreateAlertRequestBase {
  type: "budget_exceeded";
  threshold: number;
  window?: string;
}

export interface EnzanCreateOptimizationAvailableAlertRequest extends EnzanCreateAlertRequestBase {
  type: "optimization_available";
  window?: TimeWindow;
}

export interface EnzanCreatePricingChangeAlertRequest extends EnzanCreateAlertRequestBase {
  type: "pricing_change";
}

export interface EnzanCreateDailySummaryAlertRequest extends EnzanCreateAlertRequestBase {
  type: "daily_summary";
  window?: "24h";
}

export type EnzanCreateAlertRequest =
  | EnzanCreateCostThresholdAlertRequest
  | EnzanCreateCostAnomalyAlertRequest
  | EnzanCreateBudgetExceededAlertRequest
  | EnzanCreateOptimizationAvailableAlertRequest
  | EnzanCreatePricingChangeAlertRequest
  | EnzanCreateDailySummaryAlertRequest;

export interface EnzanUpdateAlertRequest {
  name?: string;
  threshold?: number;
  window?: TimeWindow | "";
  labels?: Record<string, string>;
  enabled?: boolean;
}

export interface EnzanAlertMutationResponse {
  status: string;
  alert: EnzanAlert;
}

export interface EnzanAlertEndpoint {
  id: string;
  kind: "webhook";
  targetUrl: string;
  hasSigningSecret: boolean;
  enabled: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnzanAlertEndpointCreateRequest {
  targetUrl: string;
  signingSecret?: string;
}

export interface EnzanAlertEndpointUpdateRequest {
  targetUrl?: string;
  signingSecret?: string;
  enabled?: boolean;
}

export interface EnzanAlertEndpointMutationResponse {
  status: string;
  endpoint: EnzanAlertEndpoint;
}

export interface EnzanAlertEvent {
  id: string;
  ruleId?: string;
  type: AlertType;
  dedupeKey: string;
  payload: Record<string, unknown>;
  triggeredAt: string;
}

export interface EnzanAlertDelivery {
  id: string;
  eventId: string;
  endpointId?: string;
  status: "pending" | "sent" | "failed";
  retryCount: number;
  nextRetryAt: string;
  lastAttemptedAt?: string;
  lastResponseCode?: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
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
