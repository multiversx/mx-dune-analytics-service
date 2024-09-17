import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@libs/common";
import { EventsModule } from "./events/events.module";

@Module({
  imports: [
    EventsModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class EndpointsModule { }
