import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/database';
import { DynamicModuleUtils } from '@libs/common';
import { DuneMockService } from './dune-mock/dune-mock.service';

@Global()
@Module({
  imports: [
    DatabaseModule,
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [
    DuneMockService,
  ],
  exports: [
    DuneMockService,
  ],
})
export class DuneMockServicesModule { }
