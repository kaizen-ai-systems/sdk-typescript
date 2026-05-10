import { KaizenError } from "../core/errors";
import { HttpClient } from "../core/http";
import {
  AkumaCreateSourceRequest,
  AkumaExplainResponse,
  AkumaInteractiveQueryResponse,
  AkumaQueryRequest,
  AkumaQueryResponse,
  AkumaSchemaRequest,
  AkumaSchemaResponse,
  AkumaSourceMutationResponse,
  AkumaSourcesResponse,
} from "../types/akuma";

function interactiveResponseErrorData(response: unknown): Record<string, unknown> {
  if (response !== null && typeof response === "object" && !Array.isArray(response)) {
    return response as Record<string, unknown>;
  }
  return { response };
}

export class AkumaClient {
  constructor(private http: HttpClient) {}

  /** Translate natural language to SQL */
  async query(req: AkumaQueryRequest): Promise<AkumaQueryResponse> {
    return this.http.post<AkumaQueryResponse>("/v1/akuma/query", req);
  }

  /** Run a query through the interactive Akuma protocol */
  async queryInteractive(req: AkumaQueryRequest): Promise<AkumaInteractiveQueryResponse> {
    const response = await this.http.post<unknown>("/v1/akuma/queries/interactive", req);
    const responseData = interactiveResponseErrorData(response);
    if (response === null || typeof response !== "object" || Array.isArray(response)) {
      throw new KaizenError(
        "interactive query response must be an object",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        responseData,
      );
    }
    const payload = response as AkumaInteractiveQueryResponse;
    const payloadData = response as Record<string, unknown>;
    const hasResult = Object.prototype.hasOwnProperty.call(payloadData, "result");
    const normalized = {
      ...payload,
      result: payload.result ?? undefined,
      rawResponse: payloadData,
    };
    if (typeof payload.status !== "string" || payload.status.trim().length === 0) {
      throw new KaizenError(
        "interactive query response missing status",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    if (hasResult && (payload.result === null || typeof payload.result !== "object" || Array.isArray(payload.result))) {
      throw new KaizenError(
        "interactive query response result must be an object",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    if (
      (payload.status === "completed" || payload.status === "rejected") &&
      !hasResult
    ) {
      throw new KaizenError(
        "interactive query response missing result",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    if (
      payload.status === "rejected" &&
      (payload.result === undefined ||
        typeof payload.result.error !== "string" ||
        payload.result.error.trim().length === 0)
    ) {
      throw new KaizenError(
        "interactive query rejected response missing error",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    if (
      payload.status === "completed" &&
      typeof payload.result?.error === "string" &&
      payload.result.error.trim().length > 0
    ) {
      throw new KaizenError(
        "interactive query completed response must not include error",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    return normalized;
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
