import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/database';
import { DynamicModuleUtils } from '@libs/common';
import { HatomBorrowEventsService, LiquidityEventsService } from './events';
import { DataService } from './data';
import { DuneSenderService } from './dune-sender';
import { CsvRecordsService } from './records';

@Global()
@Module({
  imports: [
    DatabaseModule,
    DynamicModuleUtils.getCachingModule(),
    DynamicModuleUtils.getRedlockModule(),
  ],
  providers: [
    LiquidityEventsService,
    DataService,
    DuneSenderService,
    CsvRecordsService,
    HatomBorrowEventsService,
  ],
  exports: [
    LiquidityEventsService,
    DataService,
    DuneSenderService,
    CsvRecordsService,
    HatomBorrowEventsService,
  ],
})
export class ServicesModule { }
