import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/database';
import { DynamicModuleUtils } from '@libs/common';
import { EventsService } from './events';
import { DataService } from './data';
import { DuneSenderService } from './dune-sender';
import { CsvRecordsService } from './records';

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
  ],
  exports: [
    EventsService,
    DataService,
    DuneSenderService,
    CsvRecordsService,
  ],
})
export class ServicesModule { }
