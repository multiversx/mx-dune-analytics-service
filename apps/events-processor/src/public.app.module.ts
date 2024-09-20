import { Module } from '@nestjs/common';
import { DynamicModuleUtils } from '@libs/common';
import { LoggingModule } from '@multiversx/sdk-nestjs-common';
import { CommonConfigModule } from '@libs/common/config/common.config.module';
import { AppConfigModule } from './config/app-config.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServicesModule } from '@libs/services';

@Module({
  imports: [
    LoggingModule,
    AppConfigModule,
    CommonConfigModule,
    ScheduleModule.forRoot(),
    ServicesModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
})
export class PublicAppModule { }
