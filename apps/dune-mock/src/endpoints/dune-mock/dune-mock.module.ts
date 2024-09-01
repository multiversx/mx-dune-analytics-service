import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ServicesModule } from "@libs/services/services.module";
import { DuneMockController } from "./dune-mock.controller";
import { CsvParserMiddleware } from "./csv.middleware";

@Module({
    imports: [
        ServicesModule,
    ],
    controllers: [
        DuneMockController,
    ],
})
export class DuneMockModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
        .apply(CsvParserMiddleware)
        .forRoutes({ path: 'dune-mock/:table_name/insert', method: RequestMethod.POST });
    }
 }
