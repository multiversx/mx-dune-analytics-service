import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@libs/common";
import { DuneMockModule } from "./dune-mock/dune-mock.module";

@Module({
    imports: [
        DuneMockModule,
    ],
    providers: [
        DynamicModuleUtils.getNestJsApiConfigService(),
    ],
})
export class EndpointsModule { }
