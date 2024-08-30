import { Module } from "@nestjs/common";
import { ServicesModule } from "@libs/services/services.module";
import { DuneMockController } from "./dune-mock.controller";

@Module({
    imports: [
        ServicesModule,
    ],
    controllers: [
        DuneMockController,
    ],
})
export class DuneMockModule { }
