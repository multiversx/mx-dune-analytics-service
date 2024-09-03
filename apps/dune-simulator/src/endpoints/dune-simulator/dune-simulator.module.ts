import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { DuneSimulatorController } from "./dune-simulator.controller";
import { DuneSimulatorServicesModule } from "@libs/services";
import { CsvParserMiddleware } from "./csv.middleware";
@Module({
    imports: [
        DuneSimulatorServicesModule,
    ],
    controllers: [
        DuneSimulatorController,
    ],
})
export class DuneSimulatorModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(CsvParserMiddleware)
            .forRoutes({ path: 'dune-simulator/:name_space/:table_name/insert', method: RequestMethod.POST });
    }
}
