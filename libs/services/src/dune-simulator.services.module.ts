import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@libs/database';
import { DynamicModuleUtils } from '@libs/common';
import { DuneSimulatorService } from './dune-simulator/dune-simulator.service';

@Global()
@Module({
  imports: [
    DatabaseModule,
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [
    DuneSimulatorService,
  ],
  exports: [
    DuneSimulatorService,
  ],
})
export class DuneSimulatorServicesModule { }
