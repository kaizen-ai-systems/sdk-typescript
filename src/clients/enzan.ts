import { HttpClient } from "../core/http";
import {
  EnzanAlert,
  EnzanAlertMutationResponse,
  EnzanCreateAlertRequest,
  EnzanAlertDelivery,
  EnzanAlertEndpoint,
  EnzanAlertEndpointCreateRequest,
  EnzanAlertEvent,
  EnzanAlertEndpointMutationResponse,
  EnzanAlertEndpointUpdateRequest,
  EnzanBurnResponse,
  EnzanGPUOffer,
  EnzanGPUPricing,
  EnzanGPUPricingMutationResponse,
  EnzanGPUPricingUpsertRequest,
  EnzanLLMOffer,
  EnzanLLMPricing,
  EnzanLLMPricingMutationResponse,
  EnzanLLMPricingUpsertRequest,
  EnzanPricingOfferUpsertRequest,
  EnzanPricingOfferUpsertResponse,
  EnzanPricingProvider,
  EnzanPricingRefreshLogEntry,
  EnzanPricingRefreshTriggerResponse,
  EnzanRoutingConfig,
  EnzanRoutingConfigMutationResponse,
  EnzanRoutingConfigUpsertRequest,
  EnzanRoutingSavingsBreakdown,
  EnzanRoutingSavingsResponse,
  EnzanModelCategoryBreakdown,
  EnzanModelCostRequest,
  EnzanModelCostResponse,
  EnzanOptimizeRequest,
  EnzanOptimizeResponse,
  EnzanRecommendationType,
  EnzanChatRequest,
  EnzanChatResponse,
  EnzanSuggestedAction,
  EnzanResource,
  EnzanSummaryRequest,
  EnzanSummaryResponse,
  EnzanSummaryRow,
  EnzanUpdateAlertRequest,
} from "../types/enzan";

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function mapSummaryRow(row: Record<string, unknown>): EnzanSummaryRow {
  return {
    project: typeof row.project === "string" ? row.project : undefined,
    model: typeof row.model === "string" ? row.model : undefined,
    team: typeof row.team === "string" ? row.team : undefined,
    provider: typeof row.provider === "string" ? row.provider : undefined,
    endpoint: typeof row.endpoint === "string" ? row.endpoint : undefined,
    costUsd: asNumber(row.costUsd ?? row.cost_usd),
    gpuHours: asNumber(row.gpuHours ?? row.gpu_hours),
    requests: asNumber(row.requests),
    tokensIn: asNumber(row.tokensIn ?? row.tokens_in),
    tokensOut: asNumber(row.tokensOut ?? row.tokens_out),
    avgUtilPct:
      typeof (row.avgUtilPct ?? row.avg_util_pct) === "number"
        ? asNumber(row.avgUtilPct ?? row.avg_util_pct)
        : undefined,
  };
}

function mapModelCostCategory(row: Record<string, unknown>): EnzanModelCategoryBreakdown {
  const category =
    row.category === "simple" || row.category === "moderate" || row.category === "complex"
      ? row.category
      : "moderate";
  return {
    category,
    queries: asNumber(row.queries),
    promptTokens: asNumber(row.promptTokens ?? row.prompt_tokens),
    outputTokens: asNumber(row.outputTokens ?? row.output_tokens),
    costUsd: asNumber(row.costUsd ?? row.cost_usd),
    percentage: asNumber(row.percentage),
    avgCostPerQuery: asNumber(row.avgCostPerQuery ?? row.avg_cost_per_query),
  };
}

function mapLLMPricing(row: Record<string, unknown>): EnzanLLMPricing {
  return {
    provider: typeof row.provider === "string" ? row.provider : "",
    model: typeof row.model === "string" ? row.model : "",
    displayName: typeof (row.displayName ?? row.display_name) === "string" ? String(row.displayName ?? row.display_name) : "",
    inputCostPer1KTokensUsd: asNumber(row.inputCostPer1KTokensUsd ?? row.input_cost_per_1k_tokens_usd),
    outputCostPer1KTokensUsd: asNumber(row.outputCostPer1KTokensUsd ?? row.output_cost_per_1k_tokens_usd),
    currency: typeof row.currency === "string" ? row.currency : "USD",
    active: typeof row.active === "boolean" ? row.active : true,
  };
}

function mapGPUPricing(row: Record<string, unknown>): EnzanGPUPricing {
  return {
    provider: typeof row.provider === "string" ? row.provider : "",
    gpuType: typeof (row.gpuType ?? row.gpu_type) === "string" ? String(row.gpuType ?? row.gpu_type) : "",
    displayName: typeof (row.displayName ?? row.display_name) === "string" ? String(row.displayName ?? row.display_name) : "",
    hourlyRateUsd: asNumber(row.hourlyRateUsd ?? row.hourly_rate_usd),
    currency: typeof row.currency === "string" ? row.currency : "USD",
    active: typeof row.active === "boolean" ? row.active : true,
  };
}

function mapRoutingConfig(row: Record<string, unknown>): EnzanRoutingConfig {
  return {
    enabled: typeof row.enabled === "boolean" ? row.enabled : false,
    provider: typeof row.provider === "string" ? row.provider : "",
    defaultModel: typeof (row.defaultModel ?? row.default_model) === "string" ? String(row.defaultModel ?? row.default_model) : "",
    simpleModel:
      typeof (row.simpleModel ?? row.simple_model) === "string" ? String(row.simpleModel ?? row.simple_model) : undefined,
    moderateModel:
      typeof (row.moderateModel ?? row.moderate_model) === "string" ? String(row.moderateModel ?? row.moderate_model) : undefined,
    complexModel:
      typeof (row.complexModel ?? row.complex_model) === "string" ? String(row.complexModel ?? row.complex_model) : undefined,
    updatedAt: typeof (row.updatedAt ?? row.updated_at) === "string" ? String(row.updatedAt ?? row.updated_at) : undefined,
  };
}

function mapRoutingSavingsBreakdown(row: Record<string, unknown>): EnzanRoutingSavingsBreakdown {
  return {
    promptCategory:
      typeof (row.promptCategory ?? row.prompt_category) === "string" ? String(row.promptCategory ?? row.prompt_category) : "",
    originalModel:
      typeof (row.originalModel ?? row.original_model) === "string" ? String(row.originalModel ?? row.original_model) : "",
    routedModel:
      typeof (row.routedModel ?? row.routed_model) === "string" ? String(row.routedModel ?? row.routed_model) : "",
    queries: asNumber(row.queries),
    actualCostUsd: asNumber(row.actualCostUsd ?? row.actual_cost_usd),
    counterfactualCostUsd: asNumber(row.counterfactualCostUsd ?? row.counterfactual_cost_usd),
    estimatedSavingsUsd: asNumber(row.estimatedSavingsUsd ?? row.estimated_savings_usd),
  };
}

function mapAlertEndpoint(row: Record<string, unknown>): EnzanAlertEndpoint {
  return {
    id: typeof row.id === "string" ? row.id : "",
    kind: "webhook",
    targetUrl: typeof row.targetUrl === "string" ? row.targetUrl : "",
    hasSigningSecret: typeof row.hasSigningSecret === "boolean" ? row.hasSigningSecret : false,
    enabled: typeof row.enabled === "boolean" ? row.enabled : true,
    lastUsedAt: typeof row.lastUsedAt === "string" ? row.lastUsedAt : undefined,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
  };
}

function mapAlertEvent(row: Record<string, unknown>): EnzanAlertEvent {
  return {
    id: typeof row.id === "string" ? row.id : "",
    ruleId: typeof row.ruleId === "string" ? row.ruleId : undefined,
    type: (typeof row.type === "string" ? row.type : "cost_threshold") as EnzanAlertEvent["type"],
    dedupeKey: typeof row.dedupeKey === "string" ? row.dedupeKey : "",
    payload:
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {},
    triggeredAt: typeof row.triggeredAt === "string" ? row.triggeredAt : "",
  };
}

function mapAlertDelivery(row: Record<string, unknown>): EnzanAlertDelivery {
  const status =
    row.status === "pending" || row.status === "sent" || row.status === "failed"
      ? row.status
      : "pending";
  return {
    id: typeof row.id === "string" ? row.id : "",
    eventId: typeof row.eventId === "string" ? row.eventId : "",
    endpointId: typeof row.endpointId === "string" ? row.endpointId : undefined,
    status,
    retryCount: asNumber(row.retryCount),
    nextRetryAt: typeof row.nextRetryAt === "string" ? row.nextRetryAt : "",
    lastAttemptedAt: typeof row.lastAttemptedAt === "string" ? row.lastAttemptedAt : undefined,
    lastResponseCode: typeof row.lastResponseCode === "number" ? row.lastResponseCode : undefined,
    lastError: typeof row.lastError === "string" && row.lastError !== "" ? row.lastError : undefined,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
  };
}

export class EnzanClient {
  constructor(private http: HttpClient) {}

  /** Get GPU cost summary */
  async summary(req: EnzanSummaryRequest): Promise<EnzanSummaryResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/summary", req);
    const rawTotal = (raw.total ?? {}) as Record<string, unknown>;
    const rawRows = Array.isArray(raw.rows) ? (raw.rows as Record<string, unknown>[]) : [];
    const rawAPICosts = raw.apiCosts as Record<string, unknown> | undefined;

    return {
      window: typeof raw.window === "string" ? raw.window : req.window,
      startTime: typeof raw.startTime === "string" ? raw.startTime : "",
      endTime: typeof raw.endTime === "string" ? raw.endTime : "",
      rows: rawRows.map(mapSummaryRow),
      total: {
        costUsd: asNumber(rawTotal.costUsd ?? rawTotal.cost_usd),
        gpuHours: asNumber(rawTotal.gpuHours ?? rawTotal.gpu_hours),
        requests: asNumber(rawTotal.requests),
        tokensIn: asNumber(rawTotal.tokensIn ?? rawTotal.tokens_in),
        tokensOut: asNumber(rawTotal.tokensOut ?? rawTotal.tokens_out),
      },
      apiCosts: rawAPICosts
        ? {
            totalCostUsd: asNumber(rawAPICosts.totalCostUsd),
            promptTokens: asNumber(rawAPICosts.promptTokens),
            outputTokens: asNumber(rawAPICosts.outputTokens),
            queries: asNumber(rawAPICosts.queries),
          }
        : undefined,
    };
  }

  /** Get model-level API cost analytics */
  async costsByModel(req: EnzanModelCostRequest): Promise<EnzanModelCostResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/costs/by-model", req);
    const rawRows = Array.isArray(raw.rows) ? (raw.rows as Record<string, unknown>[]) : [];
    const rawTotal = (raw.total ?? {}) as Record<string, unknown>;

    return {
      window: typeof raw.window === "string" ? raw.window : req.window,
      startTime: typeof raw.startTime === "string" ? raw.startTime : "",
      endTime: typeof raw.endTime === "string" ? raw.endTime : "",
      rows: rawRows.map((row) => ({
        model: typeof row.model === "string" ? row.model : "unknown",
        queries: asNumber(row.queries),
        promptTokens: asNumber(row.promptTokens ?? row.prompt_tokens),
        outputTokens: asNumber(row.outputTokens ?? row.output_tokens),
        costUsd: asNumber(row.costUsd ?? row.cost_usd),
        percentage: asNumber(row.percentage),
        avgCostPerQuery: asNumber(row.avgCostPerQuery ?? row.avg_cost_per_query),
        categories: Array.isArray(row.categories)
          ? (row.categories as Record<string, unknown>[]).map(mapModelCostCategory)
          : undefined,
      })),
      total: {
        queries: asNumber(rawTotal.queries),
        promptTokens: asNumber(rawTotal.promptTokens ?? rawTotal.prompt_tokens),
        outputTokens: asNumber(rawTotal.outputTokens ?? rawTotal.output_tokens),
        costUsd: asNumber(rawTotal.costUsd ?? rawTotal.cost_usd),
      },
    };
  }

  /** List configured LLM pricing */
  async listModelPricing(): Promise<EnzanLLMPricing[]> {
    const raw = await this.http.get<Record<string, unknown>>("/v1/enzan/pricing/models");
    const rawRows = Array.isArray(raw.models) ? (raw.models as Record<string, unknown>[]) : [];
    return rawRows.map(mapLLMPricing);
  }

  /** Get current smart-routing config */
  async routing(): Promise<EnzanRoutingConfig> {
    const raw = await this.http.get<Record<string, unknown>>("/v1/enzan/routing");
    return mapRoutingConfig((raw.routing ?? {}) as Record<string, unknown>);
  }

  /** Upsert current smart-routing config */
  async setRouting(req: EnzanRoutingConfigUpsertRequest): Promise<EnzanRoutingConfigMutationResponse> {
    if (typeof req.enabled !== "boolean") {
      throw new Error("enabled is required");
    }
    const payload: Record<string, unknown> = {
      enabled: req.enabled,
    };
    if (typeof req.simpleModel === "string") {
      payload.simple_model = req.simpleModel;
    }
    if (typeof req.moderateModel === "string") {
      payload.moderate_model = req.moderateModel;
    }
    if (typeof req.complexModel === "string") {
      payload.complex_model = req.complexModel;
    }
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/routing", payload);
    return {
      status: typeof raw.status === "string" ? raw.status : "upserted",
      routing: mapRoutingConfig((raw.routing ?? {}) as Record<string, unknown>),
    };
  }

  /** Get realized smart-routing savings for a time window */
  async routingSavings(window?: "1h" | "24h" | "7d" | "30d"): Promise<EnzanRoutingSavingsResponse> {
    const path =
      typeof window === "string" && window.length > 0
        ? `/v1/enzan/routing/savings?window=${encodeURIComponent(window)}`
        : "/v1/enzan/routing/savings";
    const raw = await this.http.get<Record<string, unknown>>(path);
    const rawBreakdown = Array.isArray(raw.breakdown) ? (raw.breakdown as Record<string, unknown>[]) : [];
    return {
      window: typeof raw.window === "string" ? raw.window : (window ?? "30d"),
      startTime: typeof (raw.startTime ?? raw.start_time) === "string" ? String(raw.startTime ?? raw.start_time) : "",
      endTime: typeof (raw.endTime ?? raw.end_time) === "string" ? String(raw.endTime ?? raw.end_time) : "",
      provider: typeof raw.provider === "string" ? raw.provider : "",
      defaultModel:
        typeof (raw.defaultModel ?? raw.default_model) === "string" ? String(raw.defaultModel ?? raw.default_model) : "",
      totalQueries: asNumber(raw.totalQueries ?? raw.total_queries),
      routedQueries: asNumber(raw.routedQueries ?? raw.routed_queries),
      actualCostUsd: asNumber(raw.actualCostUsd ?? raw.actual_cost_usd),
      counterfactualCostUsd: asNumber(raw.counterfactualCostUsd ?? raw.counterfactual_cost_usd),
      estimatedSavingsUsd: asNumber(raw.estimatedSavingsUsd ?? raw.estimated_savings_usd),
      breakdown: rawBreakdown.map(mapRoutingSavingsBreakdown),
    };
  }

  /** Upsert one LLM pricing entry */
  async upsertModelPricing(req: EnzanLLMPricingUpsertRequest): Promise<EnzanLLMPricingMutationResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/pricing/models", {
      provider: req.provider,
      model: req.model,
      display_name: req.displayName,
      input_cost_per_1k_tokens_usd: req.inputCostPer1KTokensUsd,
      output_cost_per_1k_tokens_usd: req.outputCostPer1KTokensUsd,
      currency: req.currency,
      active: req.active,
    });
    return {
      status: typeof raw.status === "string" ? raw.status : "upserted",
      pricing: mapLLMPricing((raw.pricing ?? {}) as Record<string, unknown>),
    };
  }

  /** List configured GPU pricing */
  async listGPUPricing(): Promise<EnzanGPUPricing[]> {
    const raw = await this.http.get<Record<string, unknown>>("/v1/enzan/pricing/gpus");
    const rawRows = Array.isArray(raw.gpus) ? (raw.gpus as Record<string, unknown>[]) : [];
    return rawRows.map(mapGPUPricing);
  }

  /** Upsert one GPU pricing entry */
  async upsertGPUPricing(req: EnzanGPUPricingUpsertRequest): Promise<EnzanGPUPricingMutationResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/pricing/gpus", {
      provider: req.provider,
      gpu_type: req.gpuType,
      display_name: req.displayName,
      hourly_rate_usd: req.hourlyRateUsd,
      currency: req.currency,
      active: req.active,
    });
    return {
      status: typeof raw.status === "string" ? raw.status : "upserted",
      pricing: mapGPUPricing((raw.pricing ?? {}) as Record<string, unknown>),
    };
  }

  /** Trigger an on-demand live-pricing refresh sweep (admin only) */
  async triggerPricingRefresh(): Promise<EnzanPricingRefreshTriggerResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/pricing/refresh", {});
    return {
      status: typeof raw.status === "string" ? raw.status : "",
      triggeredBy: typeof raw.triggeredBy === "string" ? raw.triggeredBy : "",
    };
  }

  /** List recent live-pricing refresh log entries (admin only). Server clamps `limit` to 1..200 and rejects non-positive values with 400. Omit to use the server default of 50; pass an integer to forward verbatim (including 0 and negative — those will hit server-side validation rather than being silently dropped client-side). NaN/Infinity/non-integer values are rejected client-side since the OpenAPI schema declares `type: integer`. */
  async listPricingRefreshLog(limit?: number): Promise<EnzanPricingRefreshLogEntry[]> {
    if (typeof limit === "number" && !Number.isInteger(limit)) {
      throw new Error("limit must be an integer");
    }
    const path =
      typeof limit === "number"
        ? `/v1/enzan/pricing/refresh/log?limit=${encodeURIComponent(String(limit))}`
        : "/v1/enzan/pricing/refresh/log";
    const raw = await this.http.get<{ entries?: EnzanPricingRefreshLogEntry[] }>(path);
    return Array.isArray(raw.entries) ? raw.entries : [];
  }

  /** List registered live-pricing sources (admin view) */
  async listPricingProviders(): Promise<EnzanPricingProvider[]> {
    const raw = await this.http.get<{ providers?: EnzanPricingProvider[] }>("/v1/enzan/pricing/providers");
    return Array.isArray(raw.providers) ? raw.providers : [];
  }

  /** Upsert one manual (admin-authored) live-pricing offer (admin only). Exactly one of gpu/llm must be set. Client-side validation rejects empty string identifiers (provider, gpuType/model, displayName) and missing/non-finite/wrong-type rate values (NaN, Infinity, undefined, non-number) before hitting the wire; explicit zero is preserved as a free offer. The server remains the authority on rate semantics beyond finiteness (e.g. domain-specific bounds). */
  async upsertPricingOffer(req: EnzanPricingOfferUpsertRequest): Promise<EnzanPricingOfferUpsertResponse> {
    if (req == null) {
      throw new Error("offer request is required");
    }
    // Branch presence is "non-null and an object" — falsy non-null values
    // like 0, "", false would otherwise pass an `if (req.gpu)` truthiness
    // check and either get type-coerced into a malformed body or
    // AttributeError on a property read.
    const gpuPresent =
      req.gpu !== null && req.gpu !== undefined && typeof req.gpu === "object";
    const llmPresent =
      req.llm !== null && req.llm !== undefined && typeof req.llm === "object";
    if (gpuPresent === llmPresent) {
      throw new Error("exactly one of gpu or llm must be set");
    }
    if (req.gpu !== null && req.gpu !== undefined && !gpuPresent) {
      throw new Error("gpu must be an object");
    }
    if (req.llm !== null && req.llm !== undefined && !llmPresent) {
      throw new Error("llm must be an object");
    }
    // Validate via typeof+trim so wrong-type inputs from plain JS callers
    // (e.g. provider: 42) surface as a clear validation error rather than a
    // TypeError from `.trim()` on a non-string. Matches Python's explicit
    // wrong-type handling.
    const requireString = (value: unknown, label: string): void => {
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`${label} is required`);
      }
    };
    // Rate fields must be finite numbers; explicit zero (free offer) is
    // allowed. typeof "number" matches both int and float; Number.isFinite
    // also rejects NaN and Infinity, which the server doesn't accept.
    const requireNumber = (value: unknown, label: string): void => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`${label} is required`);
      }
    };
    if (gpuPresent && req.gpu) {
      requireString(req.gpu.provider, "gpu.provider");
      requireString(req.gpu.gpuType, "gpu.gpuType");
      requireString(req.gpu.displayName, "gpu.displayName");
      requireNumber(req.gpu.hourlyRateUSD, "gpu.hourlyRateUSD");
    }
    if (llmPresent && req.llm) {
      requireString(req.llm.provider, "llm.provider");
      requireString(req.llm.model, "llm.model");
      requireString(req.llm.displayName, "llm.displayName");
      requireNumber(req.llm.inputCostPer1KTokensUSD, "llm.inputCostPer1KTokensUSD");
      requireNumber(req.llm.outputCostPer1KTokensUSD, "llm.outputCostPer1KTokensUSD");
    }
    // Build a sanitized payload with only the selected branch so an
    // explicit `null` on the unused branch (e.g. `{gpu: null, llm: {...}}`)
    // doesn't leak into the request body and trip the server's `oneOf`
    // validation. Matches Go/Python/MCP, which already construct a fresh body.
    const payload: EnzanPricingOfferUpsertRequest = gpuPresent ? { gpu: req.gpu } : { llm: req.llm };
    const raw = await this.http.post<EnzanPricingOfferUpsertResponse>("/v1/enzan/pricing/offers", payload);
    return {
      status: typeof raw.status === "string" ? raw.status : "",
      gpu: raw.gpu as EnzanGPUOffer | undefined,
      llm: raw.llm as EnzanLLMOffer | undefined,
    };
  }

  /** Get current burn rate */
  async burn(): Promise<EnzanBurnResponse> {
    const response = await this.http.get<{ burn_rate_usd_per_hour: number; timestamp: string }>("/v1/enzan/burn");
    return {
      burnRateUsdPerHour: response.burn_rate_usd_per_hour,
      timestamp: response.timestamp,
    };
  }

  /** List GPU resources */
  async listResources(): Promise<EnzanResource[]> {
    return (await this.http.get<{ resources: EnzanResource[] }>("/v1/enzan/resources")).resources;
  }

  /** Register a GPU resource */
  async registerResource(resource: EnzanResource): Promise<{ status: string; id: string }> {
    return this.http.post<{ status: string; id: string }>("/v1/enzan/resources", resource);
  }

  /** List alerts */
  async listAlerts(): Promise<EnzanAlert[]> {
    return (await this.http.get<{ alerts: EnzanAlert[] }>("/v1/enzan/alerts")).alerts;
  }

  /** Create an alert */
  async createAlert(alert: EnzanCreateAlertRequest): Promise<{ status: string; id: string }> {
    return this.http.post<{ status: string; id: string }>("/v1/enzan/alerts", alert);
  }

  /** Update an alert */
  async updateAlert(id: string, alert: EnzanUpdateAlertRequest): Promise<EnzanAlertMutationResponse> {
    const raw = await this.http.request<Record<string, unknown>>("PATCH", `/v1/enzan/alerts/${encodeURIComponent(id)}`, alert);
    return {
      status: typeof raw.status === "string" ? raw.status : "updated",
      alert: ((raw.alert ?? {}) as EnzanAlert),
    };
  }

  /** Delete an alert */
  async deleteAlert(id: string): Promise<{ status: string; id: string }> {
    return this.http.request<{ status: string; id: string }>("DELETE", `/v1/enzan/alerts/${encodeURIComponent(id)}`);
  }

  /** List alert delivery webhook endpoints */
  async listAlertEndpoints(): Promise<EnzanAlertEndpoint[]> {
    const raw = await this.http.get<Record<string, unknown>>("/v1/enzan/alerts/endpoints");
    const rows = Array.isArray(raw.endpoints) ? (raw.endpoints as Record<string, unknown>[]) : [];
    return rows.map(mapAlertEndpoint);
  }

  /** Create an alert delivery webhook endpoint */
  async createAlertEndpoint(req: EnzanAlertEndpointCreateRequest): Promise<EnzanAlertEndpointMutationResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/alerts/endpoints", {
      targetUrl: req.targetUrl,
      signingSecret: req.signingSecret,
    });
    return {
      status: typeof raw.status === "string" ? raw.status : "created",
      endpoint: mapAlertEndpoint((raw.endpoint ?? {}) as Record<string, unknown>),
    };
  }

  /** Update an alert delivery webhook endpoint */
  async updateAlertEndpoint(id: string, req: EnzanAlertEndpointUpdateRequest): Promise<EnzanAlertEndpointMutationResponse> {
    const raw = await this.http.request<Record<string, unknown>>("PATCH", `/v1/enzan/alerts/endpoints/${encodeURIComponent(id)}`, {
      targetUrl: req.targetUrl,
      signingSecret: req.signingSecret,
      enabled: req.enabled,
    });
    return {
      status: typeof raw.status === "string" ? raw.status : "updated",
      endpoint: mapAlertEndpoint((raw.endpoint ?? {}) as Record<string, unknown>),
    };
  }

  /** List recent alert events */
  async listAlertEvents(limit?: number): Promise<EnzanAlertEvent[]> {
    const path =
      typeof limit === "number" && limit > 0
        ? `/v1/enzan/alerts/events?limit=${encodeURIComponent(String(limit))}`
        : "/v1/enzan/alerts/events";
    const raw = await this.http.get<Record<string, unknown>>(path);
    const rows = Array.isArray(raw.events) ? (raw.events as Record<string, unknown>[]) : [];
    return rows.map(mapAlertEvent);
  }

  /** List recent alert deliveries */
  async listAlertDeliveries(limit?: number): Promise<EnzanAlertDelivery[]> {
    const path =
      typeof limit === "number" && limit > 0
        ? `/v1/enzan/alerts/deliveries?limit=${encodeURIComponent(String(limit))}`
        : "/v1/enzan/alerts/deliveries";
    const raw = await this.http.get<Record<string, unknown>>(path);
    const rows = Array.isArray(raw.deliveries) ? (raw.deliveries as Record<string, unknown>[]) : [];
    return rows.map(mapAlertDelivery);
  }

  /** Delete an alert delivery webhook endpoint */
  async deleteAlertEndpoint(id: string): Promise<{ status: string; id: string }> {
    return this.http.request<{ status: string; id: string }>("DELETE", `/v1/enzan/alerts/endpoints/${encodeURIComponent(id)}`);
  }

  /** Get optimization recommendations */
  async optimize(req: EnzanOptimizeRequest = {}): Promise<EnzanOptimizeResponse> {
    const raw = await this.http.post<Record<string, unknown>>("/v1/enzan/optimize", {
      window: req.window ?? "30d",
    });
    const rawRecs = Array.isArray(raw.recommendations)
      ? (raw.recommendations as Record<string, unknown>[])
      : [];
    return {
      window: typeof raw.window === "string" ? raw.window : (req.window ?? "30d"),
      startTime: typeof raw.startTime === "string" ? raw.startTime : "",
      endTime: typeof raw.endTime === "string" ? raw.endTime : "",
      efficiencyScore: asNumber(raw.efficiencyScore),
      monthlySpend: asNumber(raw.monthlySpend),
      potentialSavings: asNumber(raw.potentialSavings),
      recommendations: rawRecs.map((r) => ({
        type: (typeof r.type === "string" ? r.type : "model_downgrade") as EnzanRecommendationType,
        title: typeof r.title === "string" ? r.title : "",
        description: typeof r.description === "string" ? r.description : "",
        estimatedSavings: asNumber(r.estimatedSavings ?? r.estimated_savings),
        confidence: asNumber(r.confidence),
        suggestion: typeof r.suggestion === "string" ? r.suggestion : "",
      })),
    };
  }

  /** Conversational AI cost Q&A with multi-turn support. */
  async chat(req: EnzanChatRequest): Promise<EnzanChatResponse> {
    const payload: Record<string, unknown> = { message: req.message };
    if (req.conversationId) payload.conversationId = req.conversationId;
    if (req.window) payload.window = req.window;
    // Pass through extra properties (e.g., dashboard-internal `synthetic` hint)
    // that callers may add via type-cast without polluting the public SDK type.
    for (const [k, v] of Object.entries(req)) {
      if (!(k in payload) && v !== undefined) payload[k] = v;
    }

    const raw = await this.http.post<Record<string, unknown>>(
      "/v1/enzan/chat",
      payload,
    );

    const rawActions = Array.isArray(raw.suggestedActions)
      ? (raw.suggestedActions as Record<string, unknown>[])
      : [];

    return {
      conversationId:
        typeof raw.conversationId === "string" ? raw.conversationId : "",
      message: typeof raw.message === "string" ? raw.message : "",
      effectiveWindow:
        typeof raw.effectiveWindow === "string"
          ? (raw.effectiveWindow as EnzanChatResponse["effectiveWindow"])
          : undefined,
      suggestedActions: rawActions.map(
        (a) =>
          ({
            type: typeof a.type === "string" ? a.type : "set_window",
            label: typeof a.label === "string" ? a.label : "",
            ...(typeof a.window === "string" ? { window: a.window } : {}),
            ...(typeof a.model === "string" ? { model: a.model } : {}),
          }) as EnzanSuggestedAction,
      ),
      supportingData:
        raw.supportingData &&
        typeof raw.supportingData === "object" &&
        !Array.isArray(raw.supportingData)
          ? (raw.supportingData as Record<string, unknown>)
          : undefined,
    };
  }
}
