import { HttpClient } from "../core/http";
import { SozoGenerateRequest, SozoGenerateResponse, SozoSchemaInfo } from "../types/sozo";

function csvEscape(value: unknown): string {
  if (value == null) {
    return "";
  }
  const str = String(value);
  return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
}

export class SozoClient {
  constructor(private http: HttpClient) {}

  /** Generate synthetic data */
  async generate(req: SozoGenerateRequest): Promise<SozoGenerateResponse> {
    return this.http.post<SozoGenerateResponse>("/v1/sozo/generate", req);
  }

  /** List predefined schemas */
  async listSchemas(): Promise<SozoSchemaInfo[]> {
    return (await this.http.get<{ schemas: SozoSchemaInfo[] }>("/v1/sozo/schemas")).schemas;
  }

  /** Convert generation response to CSV */
  toCSV(response: SozoGenerateResponse): string {
    return [
      response.columns.join(","),
      ...response.rows.map((row) => response.columns.map((col) => csvEscape(row[col])).join(",")),
    ].join("\n");
  }

  /** Convert generation response to JSON Lines */
  toJSONL(response: SozoGenerateResponse): string {
    return response.rows.map((row) => JSON.stringify(row)).join("\n");
  }
}
