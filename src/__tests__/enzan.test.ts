import { describe, expect, it, vi } from "vitest";
import { EnzanClient } from "../clients/enzan";
import { HttpClient } from "../core/http";

describe("EnzanClient.summary", () => {
  it("maps snake_case totals and rows to camelCase fields", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        window: "24h",
        startTime: "2026-02-17T00:00:00Z",
        endTime: "2026-02-17T23:59:59Z",
        rows: [
          {
            project: "core",
            endpoint: "/v1/akuma/query",
            cost_usd: 12.5,
            gpu_hours: 3,
            requests: 42,
            tokens_in: 100,
            tokens_out: 200,
            avg_util_pct: 74.5,
          },
        ],
        total: {
          cost_usd: 12.5,
          gpu_hours: 3,
          requests: 42,
          tokens_in: 100,
          tokens_out: 200,
        },
        apiCosts: {
          totalCostUsd: 0.42,
          promptTokens: 1000,
          outputTokens: 200,
          queries: 5,
        },
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const response = await client.summary({ window: "24h" });

    expect(response.total.costUsd).toBe(12.5);
    expect(response.total.gpuHours).toBe(3);
    expect(response.rows[0].tokensIn).toBe(100);
    expect(response.rows[0].tokensOut).toBe(200);
    expect(response.rows[0].endpoint).toBe("/v1/akuma/query");
    expect(response.rows[0].avgUtilPct).toBe(74.5);
    expect(response.total.tokensIn).toBe(100);
    expect(response.total.tokensOut).toBe(200);
    expect(response.apiCosts?.totalCostUsd).toBe(0.42);
    expect(response.apiCosts?.promptTokens).toBe(1000);
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/summary", { window: "24h" });
  });

  it("omits apiCosts when the field is absent", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        window: "24h",
        startTime: "2026-02-17T00:00:00Z",
        endTime: "2026-02-17T23:59:59Z",
        rows: [],
        total: {
          cost_usd: 0,
          gpu_hours: 0,
          requests: 0,
        },
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const response = await client.summary({ window: "24h" });
    expect(response.apiCosts).toBeUndefined();
  });
});

describe("EnzanClient.costsByModel", () => {
  it("maps snake_case model analytics fields", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        window: "30d",
        startTime: "2026-03-01T00:00:00Z",
        endTime: "2026-03-30T23:59:59Z",
        rows: [
          {
            model: "gpt-4o-mini",
            queries: 12,
            prompt_tokens: 1200,
            output_tokens: 600,
            cost_usd: 3.5,
            percentage: 70,
            avg_cost_per_query: 0.291666,
            categories: [
              {
                category: "simple",
                queries: 5,
                prompt_tokens: 300,
                output_tokens: 120,
                cost_usd: 0.9,
                percentage: 25.7,
                avg_cost_per_query: 0.18,
              },
            ],
          },
        ],
        total: {
          queries: 12,
          prompt_tokens: 1200,
          output_tokens: 600,
          cost_usd: 3.5,
        },
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const response = await client.costsByModel({ window: "30d" });

    expect(response.total.costUsd).toBe(3.5);
    expect(response.rows[0].promptTokens).toBe(1200);
    expect(response.rows[0].avgCostPerQuery).toBeCloseTo(0.291666);
    expect(response.rows[0].categories?.[0].category).toBe("simple");
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/costs/by-model", { window: "30d" });
  });
});

describe("EnzanClient.optimize", () => {
  it("maps optimization recommendations with snake_case fallbacks", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        window: "30d",
        startTime: "2026-03-01T00:00:00Z",
        endTime: "2026-03-30T23:59:59Z",
        efficiencyScore: 72,
        monthlySpend: 4500,
        potentialSavings: 1200,
        recommendations: [
          {
            type: "model_downgrade",
            title: "Downgrade simple queries",
            description: "Use gpt-4o-mini for simple classification tasks",
            estimated_savings: 350,
            confidence: 0.87,
            suggestion: "Route simple queries to gpt-4o-mini",
          },
          {
            type: "duplicate_caching",
            title: "Cache repeated prompts",
            description: "15% of prompts are near-duplicates",
            estimatedSavings: 200,
            confidence: 0.92,
            suggestion: "Enable semantic caching",
          },
        ],
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const response = await client.optimize({ window: "30d" });

    expect(response.efficiencyScore).toBe(72);
    expect(response.monthlySpend).toBe(4500);
    expect(response.potentialSavings).toBe(1200);
    expect(response.recommendations).toHaveLength(2);
    expect(response.recommendations[0].type).toBe("model_downgrade");
    expect(response.recommendations[0].estimatedSavings).toBe(350);
    expect(response.recommendations[1].estimatedSavings).toBe(200);
    expect(response.recommendations[1].confidence).toBe(0.92);
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/optimize", { window: "30d" });
  });

  it("uses default 30d window when no request provided", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        window: "30d",
        startTime: "2026-03-01T00:00:00Z",
        endTime: "2026-03-30T23:59:59Z",
        efficiencyScore: 85,
        monthlySpend: 1000,
        potentialSavings: 100,
        recommendations: [],
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const response = await client.optimize();

    expect(response.window).toBe("30d");
    expect(response.recommendations).toHaveLength(0);
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/optimize", { window: "30d" });
  });
});

describe("EnzanClient pricing catalog", () => {
  it("maps LLM pricing catalog rows and GPU pricing mutation responses", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        models: [
          {
            provider: "openai",
            model: "gpt-4o-mini",
            display_name: "GPT-4o mini",
            input_cost_per_1k_tokens_usd: 0.00015,
            output_cost_per_1k_tokens_usd: 0.0006,
            currency: "USD",
            active: true,
          },
        ],
      }),
      post: vi.fn().mockResolvedValue({
        status: "upserted",
        pricing: {
          provider: "runpod",
          gpu_type: "h100",
          display_name: "H100",
          hourly_rate_usd: 1.99,
          currency: "USD",
          active: true,
        },
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const models = await client.listModelPricing();
    const gpu = await client.upsertGPUPricing({
      provider: "runpod",
      gpuType: "h100",
      hourlyRateUsd: 1.99,
    });

    expect(models[0].displayName).toBe("GPT-4o mini");
    expect(models[0].inputCostPer1KTokensUsd).toBe(0.00015);
    expect(gpu.pricing.gpuType).toBe("h100");
    expect(http.get).toHaveBeenCalledWith("/v1/enzan/pricing/models");
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/pricing/gpus", {
      provider: "runpod",
      gpu_type: "h100",
      display_name: undefined,
      hourly_rate_usd: 1.99,
      currency: undefined,
      active: undefined,
    });
  });
});

describe("EnzanClient alert history", () => {
  it("maps alert events and deliveries and forwards optional limits", async () => {
    const http = {
      get: vi
        .fn()
        .mockResolvedValueOnce({
          events: [
            {
              id: "event-1",
              ruleId: "rule-1",
              type: "cost_threshold",
              dedupeKey: "cost_threshold:rule-1:2026-04-04",
              payload: { threshold: 10, spend: 12.5 },
              triggeredAt: "2026-04-04T12:00:00Z",
            },
          ],
        })
        .mockResolvedValueOnce({
          deliveries: [
            {
              id: "delivery-1",
              eventId: "event-1",
              endpointId: "endpoint-1",
              status: "sent",
              retryCount: 1,
              nextRetryAt: "2026-04-04T12:00:00Z",
              lastAttemptedAt: "2026-04-04T12:00:30Z",
              lastResponseCode: 202,
              createdAt: "2026-04-04T12:00:00Z",
              updatedAt: "2026-04-04T12:00:30Z",
            },
          ],
        }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const events = await client.listAlertEvents(25);
    const deliveries = await client.listAlertDeliveries(10);

    expect(events[0].ruleId).toBe("rule-1");
    expect(events[0].payload.threshold).toBe(10);
    expect(deliveries[0].endpointId).toBe("endpoint-1");
    expect(deliveries[0].lastResponseCode).toBe(202);
    expect(http.get).toHaveBeenNthCalledWith(1, "/v1/enzan/alerts/events?limit=25");
    expect(http.get).toHaveBeenNthCalledWith(2, "/v1/enzan/alerts/deliveries?limit=10");
  });
});

describe("EnzanClient alert management", () => {
  it("updates and deletes alerts and updates endpoints", async () => {
    const http = {
      request: vi
        .fn()
        .mockResolvedValueOnce({
          status: "updated",
          alert: {
            id: "alert-1",
            name: "Updated alert",
            type: "cost_threshold",
            threshold: 20,
            window: "7d",
            labels: { team: "finance" },
            enabled: false,
          },
        })
        .mockResolvedValueOnce({
          status: "deleted",
          id: "alert-1",
        })
        .mockResolvedValueOnce({
          status: "updated",
          endpoint: {
            id: "endpoint-1",
            kind: "webhook",
            targetUrl: "https://hooks.example.com/new",
            hasSigningSecret: true,
            enabled: false,
            createdAt: "2026-04-08T00:00:00Z",
            updatedAt: "2026-04-08T00:05:00Z",
          },
        }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const updatedAlert = await client.updateAlert("alert-1", { enabled: false, window: "" });
    const deletedAlert = await client.deleteAlert("alert-1");
    const updatedEndpoint = await client.updateAlertEndpoint("endpoint-1", { signingSecret: "", enabled: false });

    expect(updatedAlert.alert.enabled).toBe(false);
    expect(updatedAlert.alert.window).toBe("7d");
    expect(deletedAlert.id).toBe("alert-1");
    expect(updatedEndpoint.endpoint.enabled).toBe(false);
    expect(http.request).toHaveBeenNthCalledWith(1, "PATCH", "/v1/enzan/alerts/alert-1", { enabled: false, window: "" });
    expect(http.request).toHaveBeenNthCalledWith(2, "DELETE", "/v1/enzan/alerts/alert-1");
    expect(http.request).toHaveBeenNthCalledWith(3, "PATCH", "/v1/enzan/alerts/endpoints/endpoint-1", {
      targetUrl: undefined,
      signingSecret: "",
      enabled: false,
    });
  });
});
