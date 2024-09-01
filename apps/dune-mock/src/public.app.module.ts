import { Module } from '@nestjs/common';
import { EndpointsModule } from './endpoints/endpoints.module';
import { DynamicModuleUtils } from '@libs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { CommonConfigModule } from '@libs/common/config/common.config.module';
import { DuneMockConfigModule } from './config/dune-mock-config.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    LoggingModule,
    EndpointsModule,
    DuneMockConfigModule,
    CommonConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class PublicAppModule { }
