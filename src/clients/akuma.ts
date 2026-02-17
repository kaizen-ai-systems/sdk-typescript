import { HttpClient } from "../core/http";
import {
  AkumaExplainResponse,
  AkumaQueryRequest,
  AkumaQueryResponse,
  AkumaSchemaRequest,
  AkumaSchemaResponse,
} from "../types/akuma";

export class AkumaClient {
  constructor(private http: HttpClient) {}

  /** Translate natural language to SQL */
  async query(req: AkumaQueryRequest): Promise<AkumaQueryResponse> {
    return this.http.post<AkumaQueryResponse>("/v1/akuma/query", req);
  }

  /** Explain a SQL query in plain English */
  async explain(sql: string): Promise<AkumaExplainResponse> {
    return this.http.post<AkumaExplainResponse>("/v1/akuma/explain", { sql });
  }

  /** Set schema context used by Akuma query generation */
  async setSchema(schema: AkumaSchemaRequest): Promise<AkumaSchemaResponse> {
    return this.http.post<AkumaSchemaResponse>("/v1/akuma/schema", schema);
  }
}
