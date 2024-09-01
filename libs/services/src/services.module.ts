import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/database';
import { DynamicModuleUtils } from '@libs/common';
import { EventsService } from './events';
import { DataService } from './data';
import { DuneSenderService } from './dune-sender';
import { CsvRecordsService } from './records';
import { DuneMockService } from './dune-mock';
import { AppConfigService } from 'apps/api/src/config/app-config.service';

@Global()
@Module({
  imports: [
    DatabaseModule,
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [
    EventsService,
    DataService,
    DuneSenderService,
    CsvRecordsService,
    DuneMockService,
    AppConfigService,
  ],
  exports: [
    EventsService,
    DataService,
    DuneSenderService,
    CsvRecordsService,
    DuneMockService,
  ],
})
export class ServicesModule { }
