import { Global, Module } from '@nestjs/common';
import { TokenService } from './token/token.service';
import { UserService } from './user/user.service';
import { DatabaseModule } from '@libs/database';
import { ExampleService } from './example/example.service';
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
    TokenService,
    UserService,
    ExampleService,
    EventsService,
    DataService,
    DuneSenderService,
    CsvRecordsService,
  ],
  exports: [
    TokenService,
    UserService,
    ExampleService,
    EventsService,
    DataService,
    DuneSenderService,
    CsvRecordsService,
  ],
})
export class ServicesModule { }
