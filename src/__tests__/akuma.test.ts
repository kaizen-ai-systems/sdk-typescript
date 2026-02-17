import { describe, expect, it, vi } from "vitest";
import { AkumaClient } from "../clients/akuma";
import { HttpClient } from "../core/http";

describe("AkumaClient", () => {
  it("posts query payload to the akuma query endpoint", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({ sql: "select 1" }),
    } as unknown as HttpClient;

    const client = new AkumaClient(http);
    const response = await client.query({
      dialect: "postgres",
      prompt: "show one row",
      mode: "sql-only",
    });

    expect(response.sql).toBe("select 1");
    expect(http.post).toHaveBeenCalledWith("/v1/akuma/query", {
      dialect: "postgres",
      prompt: "show one row",
      mode: "sql-only",
    });
  });
});

