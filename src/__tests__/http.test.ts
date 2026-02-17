import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpClient } from "../core/http";
import { KaizenAuthError, KaizenRateLimitError } from "../core/errors";

const fetchMock = vi.fn();

function mockResponse(body: unknown, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

describe("HttpClient", () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("throws auth error on 401", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ error: "bad key" }, 401, { "X-Request-ID": "req-auth-1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "https://example.com", apiKey: "k" });
    await expect(client.get("/x")).rejects.toMatchObject({
      name: KaizenAuthError.name,
      requestId: "req-auth-1",
    });
  });

  it("throws rate limit error with retry-after on 429", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ error: "slow down" }, 429, { "Retry-After": "7", "X-Request-ID": "req-rate-1" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "https://example.com", apiKey: "k" });
    await expect(client.get("/x")).rejects.toMatchObject({
      name: KaizenRateLimitError.name,
      retryAfter: 7,
      requestId: "req-rate-1",
    });
  });

  it("sends SDK user agent header in server runtime", async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true }, 200));
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpClient({ baseUrl: "https://example.com", apiKey: "k" });
    await client.get("/x");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/x",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": "kaizen-typescript/1.0.0",
        }),
      }),
    );
  });
});
