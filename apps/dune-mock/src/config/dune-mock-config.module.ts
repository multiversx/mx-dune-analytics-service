import { Global, Module } from "@nestjs/common";
import { DuneMockConfigService } from "./dune-mock-config.service";

@Global()
@Module({
  providers: [
    DuneMockConfigService,
  ],
  exports: [
    DuneMockConfigService,
  ],
})
export class DuneMockConfigModule { }
