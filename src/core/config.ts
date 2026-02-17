export interface KaizenConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export const DEFAULT_BASE_URL = "https://api.kaizenaisystems.com";
export const DEFAULT_TIMEOUT_MS = 30000;
export const SDK_VERSION = "1.0.0";
