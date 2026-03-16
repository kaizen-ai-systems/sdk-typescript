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
