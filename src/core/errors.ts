export class KaizenError extends Error {
  /** Extra fields from the error response body (e.g. conversationId). */
  public data?: Record<string, unknown>;
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public requestId?: string,
    data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "KaizenError";
    this.data = data;
  }
}

export class KaizenAuthError extends KaizenError {
  constructor(message = "Invalid or missing API key", requestId?: string) {
    super(message, 401, "AUTH_ERROR", requestId);
    this.name = "KaizenAuthError";
  }
}

export class KaizenRateLimitError extends KaizenError {
  constructor(
    message = "Rate limit exceeded",
    public retryAfter?: number,
    requestId?: string,
    data?: Record<string, unknown>,
  ) {
    super(message, 429, "RATE_LIMIT", requestId, data);
    this.name = "KaizenRateLimitError";
  }
}
