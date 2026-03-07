import { HttpClient } from "../core/http";
import {
  AkumaCreateSourceRequest,
  AkumaExplainResponse,
  AkumaQueryRequest,
  AkumaQueryResponse,
  AkumaSchemaRequest,
  AkumaSchemaResponse,
  AkumaSourceMutationResponse,
  AkumaSourcesResponse,
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

  /** Persist a manual schema source for Akuma query generation */
  async setSchema(schema: AkumaSchemaRequest): Promise<AkumaSchemaResponse> {
    return this.http.post<AkumaSchemaResponse>("/v1/akuma/schema", schema);
  }

  /** List persisted Akuma data sources */
  async listSources(): Promise<AkumaSourcesResponse> {
    return this.http.get<AkumaSourcesResponse>("/v1/akuma/sources");
  }

  /** Create a live Akuma data source */
  async createSource(req: AkumaCreateSourceRequest): Promise<AkumaSourceMutationResponse> {
    return this.http.post<AkumaSourceMutationResponse>("/v1/akuma/sources", req);
  }

  /** Delete a persisted Akuma data source */
  async deleteSource(id: string): Promise<AkumaSourceMutationResponse> {
    return this.http.request<AkumaSourceMutationResponse>("DELETE", `/v1/akuma/sources/${id}`);
  }

  /** Trigger an immediate live sync for a persisted Akuma data source */
  async syncSource(id: string): Promise<AkumaSourceMutationResponse> {
    return this.http.post<AkumaSourceMutationResponse>(`/v1/akuma/sources/${id}/sync`, {});
  }
}
