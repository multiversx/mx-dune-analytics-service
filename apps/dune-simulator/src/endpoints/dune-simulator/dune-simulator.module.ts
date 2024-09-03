import { Module } from "@nestjs/common";
import { DuneSimulatorController } from "./dune-simulator.controller";
import { DuneSimulatorServicesModule } from "@libs/services";

@Module({
    imports: [
        DuneSimulatorServicesModule,
    ],
    controllers: [
        DuneSimulatorController,
    ],
})
export class DuneSimulatorModule { }
