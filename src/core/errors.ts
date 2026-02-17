export class KaizenError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public requestId?: string,
  ) {
    super(message);
    this.name = "KaizenError";
  }
}

export class KaizenAuthError extends KaizenError {
  constructor(message = "Invalid or missing API key", requestId?: string) {
    super(message, 401, "AUTH_ERROR", requestId);
    this.name = "KaizenAuthError";
  }
}

export class KaizenRateLimitError extends KaizenError {
  constructor(message = "Rate limit exceeded", public retryAfter?: number, requestId?: string) {
    super(message, 429, "RATE_LIMIT", requestId);
    this.name = "KaizenRateLimitError";
  }
}
