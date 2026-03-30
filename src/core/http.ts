import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS, KaizenConfig, SDK_VERSION } from "./config";
import { KaizenAuthError, KaizenError, KaizenRateLimitError } from "./errors";

type JsonObject = Record<string, unknown>;

export class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: KaizenConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.apiKey = config.apiKey || "";
    this.timeout = config.timeout || DEFAULT_TIMEOUT_MS;
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const hasBody = body !== undefined;

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.buildHeaders(method, hasBody),
        body: hasBody ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await this.parseJsonBody(res);
      this.throwIfHttpError(res.status, data, res.headers);
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof KaizenError) {
        throw error;
      }
      throw new KaizenError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  private buildHeaders(method: string, hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {};
    if (hasBody && method !== "GET") {
      headers["Content-Type"] = "application/json";
    }
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    if (typeof window === "undefined") {
      headers["User-Agent"] = `kaizen-typescript/${SDK_VERSION}`;
    }
    return headers;
  }

  private async parseJsonBody(res: Response): Promise<JsonObject> {
    const raw = await res.text();
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as JsonObject;
    } catch {
      if (res.status >= 400) {
        return { error: raw };
      }
      const requestId = res.headers.get("X-Request-ID") ?? undefined;
      throw new KaizenError("Invalid JSON response", res.status, "INVALID_JSON", requestId);
    }
  }

  private throwIfHttpError(status: number, data: JsonObject, headers: Headers): void {
    if (status < 400) {
      return;
    }
    const requestId = headers.get("X-Request-ID") ?? undefined;
    const message = typeof data.error === "string" ? data.error : "Request failed";

    if (status === 401) {
      throw new KaizenAuthError(message, requestId);
    }
    if (status === 429) {
      const retryAfterRaw = headers.get("Retry-After");
      const retryAfter = retryAfterRaw ? Number(retryAfterRaw) : undefined;
      throw new KaizenRateLimitError(message, Number.isFinite(retryAfter) ? retryAfter : undefined, requestId);
    }

    throw new KaizenError(message, status, undefined, requestId, data as Record<string, unknown>);
  }
}
