import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/database';
import { DynamicModuleUtils } from '@libs/common';
import { HatomBorrowEventsService, HatomEnterMarketEventsService, LiquidityEventsService } from './events';
import { DataService } from './data';
import { DuneSenderService } from './dune-sender';
import { CsvRecordsService } from './records';
import { EventProcessor } from './event-processor/event.processor';
import { ProcessorService } from './event-processor/processor.service';

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
    HatomEnterMarketEventsService,
    EventProcessor,
    ProcessorService,
  ],
  exports: [
    LiquidityEventsService,
    DataService,
    DuneSenderService,
    CsvRecordsService,
    HatomBorrowEventsService,
    HatomEnterMarketEventsService,
    EventProcessor,
    ProcessorService,
  ],
})
export class ServicesModule { }
