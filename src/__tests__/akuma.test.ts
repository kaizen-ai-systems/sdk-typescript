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
      sourceId: "src_123",
    });

    expect(response.sql).toBe("select 1");
    expect(http.post).toHaveBeenCalledWith("/v1/akuma/query", {
      dialect: "postgres",
      prompt: "show one row",
      mode: "sql-only",
      sourceId: "src_123",
    });
  });

  it("creates a live source", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({ status: "syncing", sourceId: "src_123" }),
    } as unknown as HttpClient;

    const client = new AkumaClient(http);
    const response = await client.createSource({
      name: "Warehouse",
      dialect: "postgres",
      connectionString: "postgres://user:pass@db.example.com/app",
      targetSchemas: ["public"],
    });

    expect(response.sourceId).toBe("src_123");
    expect(http.post).toHaveBeenCalledWith("/v1/akuma/sources", {
      name: "Warehouse",
      dialect: "postgres",
      connectionString: "postgres://user:pass@db.example.com/app",
      targetSchemas: ["public"],
    });
  });
});
