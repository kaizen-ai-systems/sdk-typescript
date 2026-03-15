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
