import { configuration } from "@libs/common/config/configuration";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AppConfigService {
  readonly config = configuration().apps.duneMock;

  getDuneNamespace(): string {
    return configuration().libs.common.features.dune.namespace ?? "";
  }

  getDuneApiKey(): string {
    return configuration().libs.common.features.dune.apiKey ?? "";
  }

  getApiUrl(): string {
    return configuration().libs.common.urls.api ?? "";
  }

  getDataApiCexUrl(): string {
    return configuration().libs.common.urls.dataApiCex ?? "";
  }

  getDataApiXexchangeUrl(): string {
    return configuration().libs.common.urls.dataApiXexchange ?? "";
  }

  getDuneMockApiUrl(): string {
    return configuration().libs.common.urls.duneMockApi ?? "";
  }

  isDuneSendingEnabled(): boolean {
    return configuration().libs.common.features.dune.enabled ?? false;
  }
}