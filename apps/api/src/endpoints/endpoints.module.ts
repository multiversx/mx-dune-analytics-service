import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "@libs/common";
import { AuthModule } from "./auth/auth.module";
import { TokenModule } from "./token/token.module";
import { UserModule } from "./user/user.module";
import { ExampleModule } from "./example/example.module";
import { EventsModule } from "./events/events.module";

@Module({
  imports: [
    AuthModule,
    TokenModule,
    UserModule,
    ExampleModule,
    EventsModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class EndpointsModule { }
