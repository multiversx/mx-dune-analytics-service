import { Module } from '@nestjs/common';
import { ApiMetricsController, HealthCheckController } from '@libs/common';
import { ApiMetricsModule, DynamicModuleUtils } from '@libs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { CommonConfigModule } from '@libs/common/config/common.config.module';
import { DuneMockConfigModule } from './config/dune-mock-config.module';

@Module({
  imports: [
    LoggingModule,
    ApiMetricsModule,
    DynamicModuleUtils.getCachingModule(),
    CommonConfigModule,
    DuneMockConfigModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
    DynamicModuleUtils.getPubSubService(),
  ],
  controllers: [
    ApiMetricsController,
    HealthCheckController,
  ],
})
export class PrivateAppModule { }
