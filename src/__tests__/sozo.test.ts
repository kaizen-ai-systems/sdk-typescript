import { describe, expect, it } from "vitest";
import { SozoClient } from "../clients/sozo";
import { HttpClient } from "../core/http";

describe("SozoClient exports", () => {
  const client = new SozoClient({} as unknown as HttpClient);

  it("converts response to CSV with escaped values", () => {
    const csv = client.toCSV({
      columns: ["name", "note"],
      rows: [{ name: "Alice", note: 'He said "hi", then left' }],
      stats: {},
    });

    expect(csv).toBe('name,note\nAlice,"He said ""hi"", then left"');
  });

  it("converts response to JSONL", () => {
    const jsonl = client.toJSONL({
      columns: ["id"],
      rows: [{ id: 1 }, { id: 2 }],
      stats: {},
    });

    expect(jsonl).toBe('{"id":1}\n{"id":2}');
  });
});
