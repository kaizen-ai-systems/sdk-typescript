import { describe, expect, it, vi } from "vitest";
import { EnzanClient } from "../clients/enzan";
import { KaizenError, KaizenRateLimitError } from "../core/errors";
import { HttpClient } from "../core/http";
import type { EnzanPricingOfferUpsertRequest } from "../types/enzan";

describe("8.2-public types are exported from package root", () => {
  it("exposes the new live-pricing types from @kaizen/sdk barrel", async () => {
    // codex-reviewer finding #1: live-pricing types must be importable
    // from the package root, not just from internal type modules.
    // Type-only verification — if any of these names are missing from
    // ../index.ts the import below will fail typecheck. The runtime
    // assertion is a presence check on the module's exported names.
    const root = await import("../index");
    const expected = [
      "KaizenError",
      "KaizenRateLimitError",
      "EnzanClient",
    ];
    for (const name of expected) {
      expect(root).toHaveProperty(name);
    }
    // Type-import smoke — TS will fail to compile this if any type name
    // is missing from the barrel re-exports.
    type _smoke = {
      a: import("../index").EnzanGPUOffer;
      b: import("../index").EnzanGPUOfferUpsertPayload;
      c: import("../index").EnzanLLMOffer;
      d: import("../index").EnzanLLMOfferUpsertPayload;
      e: import("../index").EnzanPricingOfferUpsertRequest;
      f: import("../index").EnzanPricingOfferUpsertResponse;
      g: import("../index").EnzanPricingProvider;
      h: import("../index").EnzanPricingRefreshLogEntry;
      i: import("../index").EnzanPricingRefreshTriggerResponse;
    };
    const _: _smoke | undefined = undefined;
    void _;
  });
});

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

describe("EnzanClient routing", () => {
  it("maps routing config and savings responses from snake_case payloads", async () => {
    const http = {
      get: vi
        .fn()
        .mockResolvedValueOnce({
          routing: {
            enabled: true,
            provider: "openai",
            default_model: "gpt-4.1",
            simple_model: "gpt-4o-mini",
            updated_at: "2026-04-16T12:00:00Z",
          },
        })
        .mockResolvedValueOnce({
          window: "7d",
          start_time: "2026-04-09T00:00:00Z",
          end_time: "2026-04-16T00:00:00Z",
          provider: "openai",
          default_model: "gpt-4.1",
          total_queries: 12,
          routed_queries: 8,
          actual_cost_usd: 1.2,
          counterfactual_cost_usd: 2.4,
          estimated_savings_usd: 1.2,
          breakdown: [
            {
              prompt_category: "simple",
              original_model: "gpt-4.1",
              routed_model: "gpt-4o-mini",
              queries: 8,
              actual_cost_usd: 1.2,
              counterfactual_cost_usd: 2.4,
              estimated_savings_usd: 1.2,
            },
          ],
        }),
      post: vi.fn().mockResolvedValue({
        status: "upserted",
        routing: {
          enabled: true,
          provider: "openai",
          default_model: "gpt-4.1",
          simple_model: "gpt-4o-mini",
        },
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const routing = await client.routing();
    const mutation = await client.setRouting({ enabled: true, simpleModel: "gpt-4o-mini" });
    const savings = await client.routingSavings("7d");

    expect(routing.defaultModel).toBe("gpt-4.1");
    expect(routing.simpleModel).toBe("gpt-4o-mini");
    expect(mutation.routing.provider).toBe("openai");
    expect(savings.routedQueries).toBe(8);
    expect(savings.breakdown[0].promptCategory).toBe("simple");
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/routing", {
      enabled: true,
      simple_model: "gpt-4o-mini",
    });
    expect(http.get).toHaveBeenNthCalledWith(2, "/v1/enzan/routing/savings?window=7d");
  });

  it("rejects missing enabled before sending the request", async () => {
    const http = {
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);

    await expect(client.setRouting({ simpleModel: "gpt-4o-mini" } as never)).rejects.toThrow("enabled is required");
    expect(http.post).not.toHaveBeenCalled();
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

describe("EnzanClient live-pricing admin (8.2-public)", () => {
  it("triggers a refresh, reads the log with limit, and lists providers", async () => {
    const http = {
      get: vi
        .fn()
        .mockResolvedValueOnce({
          entries: [
            {
              id: "11111111-1111-1111-1111-111111111111",
              kind: "on_demand",
              status: "success",
              rowsUpserted: 0,
              rowsSkipped: 0,
              durationMs: 64,
              startedAt: "2026-04-28T13:56:13.416941Z",
              finishedAt: "2026-04-28T13:56:13.483386Z",
              sourceId: "22222222-2222-2222-2222-222222222222",
              sourceName: "manual",
              triggeredBy: "33333333-3333-3333-3333-333333333333",
            },
          ],
        })
        .mockResolvedValueOnce({
          providers: [
            {
              id: "44444444-4444-4444-4444-444444444444",
              name: "manual",
              kind: "manual",
              enabled: true,
              refreshIntervalHours: 24,
              hasAdapter: true,
            },
          ],
        }),
      post: vi.fn().mockResolvedValueOnce({
        status: "queued",
        triggeredBy: "33333333-3333-3333-3333-333333333333",
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const triggered = await client.triggerPricingRefresh();
    const log = await client.listPricingRefreshLog(5);
    const providers = await client.listPricingProviders();

    expect(triggered.status).toBe("queued");
    expect(triggered.triggeredBy).toBe("33333333-3333-3333-3333-333333333333");
    expect(log).toHaveLength(1);
    expect(log[0].kind).toBe("on_demand");
    expect(log[0].status).toBe("success");
    expect(log[0].sourceName).toBe("manual");
    expect(providers).toHaveLength(1);
    expect(providers[0].hasAdapter).toBe(true);
    expect(providers[0].kind).toBe("manual");
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/pricing/refresh", {});
    expect(http.get).toHaveBeenNthCalledWith(1, "/v1/enzan/pricing/refresh/log?limit=5");
    expect(http.get).toHaveBeenNthCalledWith(2, "/v1/enzan/pricing/providers");
  });

  it("upserts a manual LLM offer and forwards the typed body without a gpu key", async () => {
    const http = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({
        status: "upserted",
        llm: {
          id: "66666666-6666-6666-6666-666666666666",
          provider: "manual-smoke",
          model: "smoke-llm",
          displayName: "Smoke LLM",
          inputCostPer1KTokensUSD: 0.001,
          outputCostPer1KTokensUSD: 0.002,
          currency: "USD",
          sourceType: "admin",
          trustStatus: "verified",
          fetchedAt: "2026-04-28T13:00:00Z",
          firstSeenAt: "2026-04-28T13:00:00Z",
          lastSeenAt: "2026-04-28T13:00:00Z",
          active: true,
        },
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const result = await client.upsertPricingOffer({
      llm: {
        provider: "manual-smoke",
        model: "smoke-llm",
        displayName: "Smoke LLM",
        inputCostPer1KTokensUSD: 0.001,
        outputCostPer1KTokensUSD: 0.002,
        currency: "USD",
      },
    });

    expect(result.status).toBe("upserted");
    expect(result.llm?.model).toBe("smoke-llm");
    expect(result.llm?.inputCostPer1KTokensUSD).toBe(0.001);
    expect(result.llm?.outputCostPer1KTokensUSD).toBe(0.002);
    expect(result.gpu).toBeUndefined();
    expect(http.post).toHaveBeenCalledWith(
      "/v1/enzan/pricing/offers",
      expect.not.objectContaining({ gpu: expect.anything() }),
    );
  });

  it("upserts a manual GPU offer and rejects payloads with both gpu and llm", async () => {
    const http = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({
        status: "upserted",
        gpu: {
          id: "55555555-5555-5555-5555-555555555555",
          provider: "manual-smoke",
          gpuType: "h100-80gb",
          displayName: "Smoke H100",
          deploymentClass: "on_demand",
          clusterSizeMin: 1,
          interconnectClass: "unknown",
          trainingReady: false,
          hourlyRateUSD: 2.99,
          currency: "USD",
          sourceType: "admin",
          trustStatus: "verified",
          fetchedAt: "2026-04-28T13:57:38.42520143Z",
          firstSeenAt: "2026-04-28T13:57:38.456857Z",
          lastSeenAt: "2026-04-28T13:57:38.456857Z",
          active: true,
        },
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const result = await client.upsertPricingOffer({
      gpu: {
        provider: "manual-smoke",
        gpuType: "h100-80gb",
        displayName: "Smoke H100",
        deploymentClass: "on_demand",
        hourlyRateUSD: 2.99,
        currency: "USD",
      },
    });

    expect(result.status).toBe("upserted");
    expect(result.gpu?.sourceType).toBe("admin");
    expect(result.gpu?.deploymentClass).toBe("on_demand");
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/pricing/offers", {
      gpu: {
        provider: "manual-smoke",
        gpuType: "h100-80gb",
        displayName: "Smoke H100",
        deploymentClass: "on_demand",
        hourlyRateUSD: 2.99,
        currency: "USD",
      },
    });

    await expect(
      client.upsertPricingOffer({
        gpu: { provider: "p", gpuType: "g", displayName: "d", hourlyRateUSD: 1 },
        llm: { provider: "p", model: "m", displayName: "d", inputCostPer1KTokensUSD: 0, outputCostPer1KTokensUSD: 0 },
      }),
    ).rejects.toThrow(/exactly one of gpu or llm/);

    await expect(client.upsertPricingOffer({})).rejects.toThrow(/exactly one of gpu or llm/);
  });

  it("rejects missing or wrong-type rate fields before sending the request", async () => {
    const http = { get: vi.fn(), post: vi.fn() } as unknown as HttpClient;
    const client = new EnzanClient(http);

    await expect(
      client.upsertPricingOffer({
        gpu: { provider: "p", gpuType: "g", displayName: "d" } as unknown as Parameters<
          typeof client.upsertPricingOffer
        >[0]["gpu"] & object,
      } as unknown as Parameters<typeof client.upsertPricingOffer>[0]),
    ).rejects.toThrow(/gpu\.hourlyRateUSD is required/);

    await expect(
      client.upsertPricingOffer({
        gpu: {
          provider: "p",
          gpuType: "g",
          displayName: "d",
          hourlyRateUSD: "1.99" as unknown as number,
        },
      }),
    ).rejects.toThrow(/gpu\.hourlyRateUSD is required/);

    await expect(
      client.upsertPricingOffer({
        llm: {
          provider: "p",
          model: "m",
          displayName: "d",
          inputCostPer1KTokensUSD: NaN,
          outputCostPer1KTokensUSD: 0,
        },
      }),
    ).rejects.toThrow(/llm\.inputCostPer1KTokensUSD is required/);

    expect(http.post).not.toHaveBeenCalled();
  });

  it("allows explicit zero rate for genuinely free offers", async () => {
    const http = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({
        status: "upserted",
        gpu: {
          id: "x",
          provider: "free",
          gpuType: "g",
          displayName: "d",
          deploymentClass: "on_demand",
          clusterSizeMin: 1,
          interconnectClass: "unknown",
          trainingReady: false,
          hourlyRateUSD: 0,
          currency: "USD",
          sourceType: "admin",
          trustStatus: "verified",
          fetchedAt: "2026-04-28T13:00:00Z",
          firstSeenAt: "2026-04-28T13:00:00Z",
          lastSeenAt: "2026-04-28T13:00:00Z",
          active: true,
        },
      }),
    } as unknown as HttpClient;
    const client = new EnzanClient(http);
    const result = await client.upsertPricingOffer({
      gpu: {
        provider: "free",
        gpuType: "g",
        displayName: "d",
        hourlyRateUSD: 0,
      },
    });
    expect(result.status).toBe("upserted");
    expect(result.gpu?.hourlyRateUSD).toBe(0);
  });

  it("rejects falsy non-null branch values like 0/empty-string/false instead of treating them as 'absent'", async () => {
    // Round 13: typeof+null check, not truthiness — `{gpu: 0}` is "present
    // but malformed", not "absent". Must error at tool boundary.
    const http = { get: vi.fn(), post: vi.fn() } as unknown as HttpClient;
    const client = new EnzanClient(http);

    await expect(
      client.upsertPricingOffer({ gpu: 0 as unknown as EnzanPricingOfferUpsertRequest["gpu"] }),
    ).rejects.toThrow(/gpu must be an object|exactly one/);

    await expect(
      client.upsertPricingOffer({ llm: "" as unknown as EnzanPricingOfferUpsertRequest["llm"] }),
    ).rejects.toThrow(/llm must be an object|exactly one/);

    await expect(
      client.upsertPricingOffer({
        gpu: {
          provider: "p",
          gpuType: "g",
          displayName: "d",
          hourlyRateUSD: 1,
        },
        llm: false as unknown as EnzanPricingOfferUpsertRequest["llm"],
      }),
    ).rejects.toThrow(/exactly one of gpu or llm|llm must be an object/);

    expect(http.post).not.toHaveBeenCalled();
  });

  it("strips an explicit null on the unused branch so the wire body never carries both keys", async () => {
    // Codex pass 10: a plain JS caller passing `{gpu: null, llm: {...}}`
    // would otherwise trip the server's oneOf validation. The client
    // builds a sanitized payload with only the selected branch.
    const http = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({ status: "upserted", llm: {} }),
    } as unknown as HttpClient;
    const client = new EnzanClient(http);
    await client.upsertPricingOffer({
      gpu: null as unknown as EnzanPricingOfferUpsertRequest["gpu"],
      llm: {
        provider: "p",
        model: "m",
        displayName: "d",
        inputCostPer1KTokensUSD: 0.001,
        outputCostPer1KTokensUSD: 0.002,
      },
    });
    expect(http.post).toHaveBeenCalledWith(
      "/v1/enzan/pricing/offers",
      expect.not.objectContaining({ gpu: expect.anything() }),
    );
    const [, sentBody] = (http.post as unknown as { mock: { calls: [string, unknown][] } }).mock.calls[0];
    expect(sentBody).toEqual({
      llm: {
        provider: "p",
        model: "m",
        displayName: "d",
        inputCostPer1KTokensUSD: 0.001,
        outputCostPer1KTokensUSD: 0.002,
      },
    });
  });

  it("rejects wrong-type or null string identifiers with a validation error (not a TypeError)", async () => {
    // Plain JS callers can pass non-string values; the SDK validates via
    // typeof+trim so they surface as ValueError, not TypeError on .trim().
    const http = { get: vi.fn(), post: vi.fn() } as unknown as HttpClient;
    const client = new EnzanClient(http);

    await expect(
      client.upsertPricingOffer({
        gpu: { provider: 42 as unknown as string, gpuType: "g", displayName: "d", hourlyRateUSD: 1 },
      }),
    ).rejects.toThrow(/gpu\.provider is required/);

    await expect(
      client.upsertPricingOffer({
        llm: {
          provider: "p",
          model: null as unknown as string,
          displayName: "d",
          inputCostPer1KTokensUSD: 0,
          outputCostPer1KTokensUSD: 0,
        },
      }),
    ).rejects.toThrow(/llm\.model is required/);
  });

  it("preserves an unexpected status string verbatim on the 202 success path (no client-side coercion)", async () => {
    // Codex-flagged: the prior implementation silently mapped any status
    // != "dropped" to "queued", hiding contract drift. The fix passes the
    // raw value through; this test guards against that regression.
    const http = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({
        status: "unexpected_future_status",
        triggeredBy: "44444444-4444-4444-4444-444444444444",
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const triggered = await client.triggerPricingRefresh();
    expect(triggered.status).toBe("unexpected_future_status");
  });

  it("surfaces 429 dropped as KaizenRateLimitError with the typed body in err.data", async () => {
    // The real HttpClient throws on >=400; the dropped body
    // ({status:"dropped",triggeredBy:"..."}) is preserved on err.data.
    // Callers branch on the typed error to handle the cap-reached path.
    const droppedData = {
      status: "dropped",
      triggeredBy: "33333333-3333-3333-3333-333333333333",
    };
    const http = {
      get: vi.fn(),
      post: vi.fn().mockRejectedValue(
        new KaizenRateLimitError("rate limited", undefined, undefined, droppedData),
      ),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    await expect(client.triggerPricingRefresh()).rejects.toMatchObject({
      name: "KaizenRateLimitError",
      status: 429,
      data: droppedData,
    });
  });

  it("surfaces 409 stale as KaizenError with status=409 and the body in err.data", async () => {
    const staleData = { status: "stale" };
    const http = {
      get: vi.fn(),
      post: vi.fn().mockRejectedValue(
        new KaizenError("conflict", 409, undefined, undefined, staleData),
      ),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    await expect(
      client.upsertPricingOffer({
        gpu: {
          provider: "manual-smoke",
          gpuType: "h100-80gb",
          displayName: "Smoke H100",
          hourlyRateUSD: 2.99,
        },
      }),
    ).rejects.toMatchObject({
      name: "KaizenError",
      status: 409,
      data: staleData,
    });
  });

  it("forwards a non-clamped limit through to the server (server is the clamp authority)", async () => {
    // Codex-flagged: prior client clamped to 200 client-side, hiding the
    // server-side validation surface. The fix forwards the raw limit so
    // server behavior stays observable from the SDK.
    const http = {
      get: vi.fn().mockResolvedValue({ entries: [] }),
      post: vi.fn(),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    await client.listPricingRefreshLog(500);
    expect(http.get).toHaveBeenCalledWith("/v1/enzan/pricing/refresh/log?limit=500");
  });

  it("forwards limit=0 verbatim so the server can return its 400 'positive integer' error", async () => {
    // Codex-flagged: prior behavior dropped non-positive limits client-side,
    // hiding the server's validation 400 path.
    const http = {
      get: vi.fn().mockResolvedValue({ entries: [] }),
      post: vi.fn(),
    } as unknown as HttpClient;
    const client = new EnzanClient(http);
    await client.listPricingRefreshLog(0);
    expect(http.get).toHaveBeenCalledWith("/v1/enzan/pricing/refresh/log?limit=0");
  });

  it("rejects non-integer limit values (NaN, Infinity, fractional) before sending", async () => {
    // Claude pass 2: OpenAPI declares limit as type: integer. Non-integer
    // numbers (NaN/Infinity/fractional) would otherwise serialize as
    // "NaN"/"Infinity"/"5.5" on the wire instead of failing fast.
    const http = { get: vi.fn(), post: vi.fn() } as unknown as HttpClient;
    const client = new EnzanClient(http);
    await expect(client.listPricingRefreshLog(NaN)).rejects.toThrow(/limit must be an integer/);
    await expect(client.listPricingRefreshLog(Infinity)).rejects.toThrow(/limit must be an integer/);
    await expect(client.listPricingRefreshLog(5.5)).rejects.toThrow(/limit must be an integer/);
    expect(http.get).not.toHaveBeenCalled();
  });

  it("forwards a negative limit verbatim", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({ entries: [] }),
      post: vi.fn(),
    } as unknown as HttpClient;
    const client = new EnzanClient(http);
    await client.listPricingRefreshLog(-1);
    expect(http.get).toHaveBeenCalledWith("/v1/enzan/pricing/refresh/log?limit=-1");
  });

  it("decodes refresh log entries with nullable source fields when the source row was deleted", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        entries: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            kind: "scheduled",
            status: "failed",
            rowsUpserted: 0,
            rowsSkipped: 0,
            startedAt: "2026-04-28T13:00:00Z",
            error: "source removed mid-sweep",
          },
        ],
      }),
      post: vi.fn(),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const log = await client.listPricingRefreshLog();
    expect(log).toHaveLength(1);
    expect(log[0].sourceId).toBeUndefined();
    expect(log[0].sourceName).toBeUndefined();
    expect(log[0].triggeredBy).toBeUndefined();
    expect(log[0].durationMs).toBeUndefined();
    expect(log[0].finishedAt).toBeUndefined();
    expect(log[0].error).toBe("source removed mid-sweep");
  });

  it("decodes refresh log entries when nullable fields arrive as explicit null (not omitted)", async () => {
    // The OpenAPI contract says nullable fields can come back as null;
    // the SDK should accept that without normalization tripping types.
    const http = {
      get: vi.fn().mockResolvedValue({
        entries: [
          {
            id: "22222222-2222-2222-2222-222222222222",
            kind: "scheduled",
            status: "failed",
            rowsUpserted: 0,
            rowsSkipped: 0,
            startedAt: "2026-04-28T13:00:00Z",
            sourceId: null,
            sourceName: null,
            triggeredBy: null,
            durationMs: null,
            finishedAt: null,
            error: null,
          },
        ],
      }),
      post: vi.fn(),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const log = await client.listPricingRefreshLog();
    expect(log[0].sourceId).toBeNull();
    expect(log[0].sourceName).toBeNull();
    expect(log[0].triggeredBy).toBeNull();
    expect(log[0].durationMs).toBeNull();
    expect(log[0].finishedAt).toBeNull();
    expect(log[0].error).toBeNull();
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
