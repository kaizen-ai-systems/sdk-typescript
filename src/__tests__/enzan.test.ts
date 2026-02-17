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
            cost_usd: 12.5,
            gpu_hours: 3,
            requests: 42,
            tokens_in: 100,
            tokens_out: 200,
          },
        ],
        total: {
          cost_usd: 12.5,
          gpu_hours: 3,
          requests: 42,
        },
      }),
    } as unknown as HttpClient;

    const client = new EnzanClient(http);
    const response = await client.summary({ window: "24h" });

    expect(response.total.costUsd).toBe(12.5);
    expect(response.total.gpuHours).toBe(3);
    expect(response.rows[0].tokensIn).toBe(100);
    expect(response.rows[0].tokensOut).toBe(200);
    expect(http.post).toHaveBeenCalledWith("/v1/enzan/summary", { window: "24h" });
  });
});
