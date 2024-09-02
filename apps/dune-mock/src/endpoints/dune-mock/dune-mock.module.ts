import { Module } from "@nestjs/common";
import { DuneMockController } from "./dune-mock.controller";
import { DuneMockServicesModule } from "@libs/services";

@Module({
    imports: [
        DuneMockServicesModule,
    ],
    controllers: [
        DuneMockController,
    ],
})
export class DuneMockModule { }
