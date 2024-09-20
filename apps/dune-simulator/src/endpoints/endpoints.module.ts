import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@libs/common";
import { DuneSimulatorModule } from "./dune-simulator/dune-simulator.module";

@Module({
  imports: [
    DuneSimulatorModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class EndpointsModule { }
