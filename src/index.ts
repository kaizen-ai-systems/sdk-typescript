// @kaizen/sdk - Official TypeScript SDK for Kaizen AI Systems
// Products: Akuma (NL→SQL) | Enzan (GPU Cost) | Sōzō (Synthetic Data)

import { KaizenClient } from "./client";
import type { KaizenConfig } from "./core/config";

export type { KaizenConfig } from "./core/config";
export { KaizenAuthError, KaizenError, KaizenRateLimitError } from "./core/errors";

export type {
  AkumaColumn,
  AkumaExplainResponse,
  AkumaForeignKey,
  AkumaQueryRequest,
  AkumaQueryResponse,
  AkumaCreateSourceRequest,
  AkumaSchemaRequest,
  AkumaSchemaResponse,
  AkumaSource,
  AkumaSourceMutationResponse,
  AkumaSourcesResponse,
  AkumaSourceStatus,
  AkumaTable,
  Guardrails,
  LiveAkumaDialect,
  QueryMode,
  SQLDialect,
} from "./types/akuma";

export type {
  AlertType,
  CreatableAlertType,
  EnzanAlert,
  EnzanCreateAlertRequest,
  EnzanAlertDelivery,
  EnzanAlertEndpoint,
  EnzanAlertEndpointCreateRequest,
  EnzanAlertEndpointMutationResponse,
  EnzanAlertEvent,
  EnzanBurnResponse,
  EnzanGPUPricing,
  EnzanGPUPricingMutationResponse,
  EnzanGPUPricingUpsertRequest,
  EnzanLLMPricing,
  EnzanLLMPricingMutationResponse,
  EnzanLLMPricingUpsertRequest,
  EnzanRoutingConfig,
  EnzanRoutingConfigMutationResponse,
  EnzanRoutingConfigUpsertRequest,
  EnzanRoutingSavingsBreakdown,
  EnzanRoutingSavingsResponse,
  EnzanModelCategoryBreakdown,
  EnzanModelCostRequest,
  EnzanModelCostResponse,
  EnzanModelCostRow,
  EnzanOptimizeRequest,
  EnzanOptimizeResponse,
  EnzanChatRequest,
  EnzanChatResponse,
  EnzanSuggestedAction,
  EnzanRecommendation,
  EnzanRecommendationType,
  EnzanResource,
  EnzanSummaryRequest,
  EnzanSummaryResponse,
  EnzanSummaryRow,
  GroupByDimension,
  TimeWindow,
} from "./types/enzan";

export type {
  CorrelationType,
  SozoColumnStats,
  SozoGenerateRequest,
  SozoGenerateResponse,
  SozoSchema,
  SozoSchemaInfo,
} from "./types/sozo";

export { AkumaClient } from "./clients/akuma";
export { EnzanClient } from "./clients/enzan";
export { SozoClient } from "./clients/sozo";
export { KaizenClient } from "./client";
export type { HealthResponse } from "./client";

const defaultClient = new KaizenClient();

export const akuma = defaultClient.akuma;
export const enzan = defaultClient.enzan;
export const sozo = defaultClient.sozo;

export function setApiKey(key: string): void {
  defaultClient.setApiKey(key);
}

export function setBaseUrl(url: string): void {
  defaultClient.setBaseUrl(url);
}

export function createClient(config: KaizenConfig): KaizenClient {
  return new KaizenClient(config);
}

export default defaultClient;
