import { KaizenError } from "../core/errors";
import { HttpClient } from "../core/http";
import {
  AkumaClarification,
  AkumaCreateSourceRequest,
  AkumaExplainResponse,
  AkumaInteractiveConsumeRequest,
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

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseAkumaInteractiveResponse(response: unknown): AkumaInteractiveQueryResponse {
  const responseData = interactiveResponseErrorData(response);
  if (!isObject(response)) {
    throw new KaizenError(
      "interactive query response must be an object",
      undefined,
      "INVALID_RESPONSE",
      undefined,
      responseData,
    );
  }
  const payload = response as unknown as AkumaInteractiveQueryResponse;
  const payloadData = response as Record<string, unknown>;
  const hasResult = Object.prototype.hasOwnProperty.call(payloadData, "result");
  const hasClarification = Object.prototype.hasOwnProperty.call(payloadData, "clarification");
  const normalized: AkumaInteractiveQueryResponse = {
    ...payload,
    result: payload.result ?? undefined,
    clarification: payload.clarification ?? undefined,
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
  if (hasResult && !isObject(payload.result)) {
    throw new KaizenError(
      "interactive query response result must be an object",
      undefined,
      "INVALID_RESPONSE",
      undefined,
      payloadData,
    );
  }
  if ((payload.status === "completed" || payload.status === "rejected") && !hasResult) {
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
  if (hasClarification && !isObject(payload.clarification)) {
    throw new KaizenError(
      "interactive query response clarification must be an object",
      undefined,
      "INVALID_RESPONSE",
      undefined,
      payloadData,
    );
  }
  if (payload.status === "needs_clarification") {
    if (!hasClarification || !isObject(payload.clarification)) {
      throw new KaizenError(
        "interactive query needs_clarification response missing clarification",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    const cl = payload.clarification as AkumaClarification;
    if (typeof cl.clarificationToken !== "string" || cl.clarificationToken.trim().length === 0) {
      throw new KaizenError(
        "interactive query needs_clarification response missing clarificationToken",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    if (typeof cl.question !== "string" || cl.question.trim().length === 0) {
      throw new KaizenError(
        "interactive query needs_clarification response missing question",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    if (!Array.isArray(cl.options) || cl.options.length < 2 || cl.options.length > 4) {
      throw new KaizenError(
        "interactive query needs_clarification response requires 2-4 options",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
    for (const opt of cl.options) {
      if (
        !isObject(opt) ||
        typeof opt.id !== "string" ||
        opt.id.trim().length === 0 ||
        typeof opt.label !== "string" ||
        opt.label.trim().length === 0
      ) {
        throw new KaizenError(
          "interactive query needs_clarification option missing id or label",
          undefined,
          "INVALID_RESPONSE",
          undefined,
          payloadData,
        );
      }
    }
    if (typeof cl.expiresAt !== "string" || cl.expiresAt.trim().length === 0) {
      throw new KaizenError(
        "interactive query needs_clarification response missing expiresAt",
        undefined,
        "INVALID_RESPONSE",
        undefined,
        payloadData,
      );
    }
  }
  return normalized;
}

export class AkumaClient {
  constructor(private http: HttpClient) {}

  /** Translate natural language to SQL */
  async query(req: AkumaQueryRequest): Promise<AkumaQueryResponse> {
    return this.http.post<AkumaQueryResponse>("/v1/akuma/query", req);
  }

  /** Run a fresh query through the interactive Akuma protocol. To consume a
   * needs_clarification response, use consumeClarification. */
  async queryInteractive(req: AkumaQueryRequest): Promise<AkumaInteractiveQueryResponse> {
    const response = await this.http.post<unknown>("/v1/akuma/queries/interactive", req);
    return parseAkumaInteractiveResponse(response);
  }

  /** Consume a previously-issued clarification by selecting one of the offered
   * options. idempotencyKey is required and is sent as the Idempotency-Key
   * header — first successful consume wins; same-key retries replay the
   * persisted result; different-key retries are rejected with a 409. */
  async consumeClarification(req: AkumaInteractiveConsumeRequest): Promise<AkumaInteractiveQueryResponse> {
    if (!req || typeof req.clarificationToken !== "string" || req.clarificationToken.trim().length === 0) {
      throw new KaizenError("clarificationToken is required", undefined, "INVALID_REQUEST");
    }
    if (typeof req.optionId !== "string" || req.optionId.trim().length === 0) {
      throw new KaizenError("optionId is required", undefined, "INVALID_REQUEST");
    }
    if (typeof req.idempotencyKey !== "string" || req.idempotencyKey.trim().length === 0) {
      throw new KaizenError("idempotencyKey is required for consume", undefined, "INVALID_REQUEST");
    }
    const response = await this.http.request<unknown>(
      "POST",
      "/v1/akuma/queries/interactive",
      {
        clarificationToken: req.clarificationToken,
        optionId: req.optionId,
      },
      { "Idempotency-Key": req.idempotencyKey },
    );
    return parseAkumaInteractiveResponse(response);
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
