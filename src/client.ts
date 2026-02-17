import { AkumaClient } from "./clients/akuma";
import { EnzanClient } from "./clients/enzan";
import { SozoClient } from "./clients/sozo";
import { KaizenConfig } from "./core/config";
import { HttpClient } from "./core/http";

export interface HealthResponse {
  status: string;
  version: string;
  products: string[];
}

export class KaizenClient {
  private readonly http: HttpClient;
  public readonly akuma: AkumaClient;
  public readonly enzan: EnzanClient;
  public readonly sozo: SozoClient;

  constructor(config: KaizenConfig = {}) {
    this.http = new HttpClient(config);
    this.akuma = new AkumaClient(this.http);
    this.enzan = new EnzanClient(this.http);
    this.sozo = new SozoClient(this.http);
  }

  setApiKey(key: string): void {
    this.http.setApiKey(key);
  }

  setBaseUrl(url: string): void {
    this.http.setBaseUrl(url);
  }

  async health(): Promise<HealthResponse> {
    return this.http.get<HealthResponse>("/health");
  }
}
