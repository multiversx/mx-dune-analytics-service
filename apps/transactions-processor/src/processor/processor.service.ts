import { Locker } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { DynamicCollectionRepository } from "@libs/database/collections";
import { EventProcessor, EventProcessorOptions } from "@libs/services/event-processor/event.processor";

@Injectable()
export class ProcessorService {
  private eventsProcessor: EventProcessor = new EventProcessor();
  // private readonly logger: Logger;

  constructor(
    private readonly dynamicCollectionService: DynamicCollectionRepository,
    // private readonly commonConfigService: CommonConfigService,
    // private readonly appConfigService: AppConfigService,
  ) {
    // this.logger = new Logger(ProcessorService.name);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleNewTransactions() {
    await Locker.lock('newTransactions', async () => {
      await this.eventsProcessor.start(new EventProcessorOptions({
        elasticUrl: 'https://index.multiversx.com',
        eventIdentifiers: ['ESDTTransfer'],
        emitterAddresses: ['erd1z08z0svvqs84dnrh5hrm47agcxmch79fslmupzgqcgfdtpp3slwqlna25a'],
        pageSize: 3,
        getLastProcessedTimestamp: async () => {
          const result = await this.dynamicCollectionService.getLastProcessedTimestamp()
          console.log(result);
          return result;
        },
        setLastProcessedTimestamp: async (nonce) => {
          await this.dynamicCollectionService.setLastProcessedTimestamp(nonce);
        },
        onEventsReceived: async (highestTimestamp, events) => {
          await Promise.resolve();
          console.log(`onEventsReceived -> highestTimestamp: ${highestTimestamp}`);
          console.log(`onEventsReceived -> events: ${JSON.stringify(events)}`);
        },
      }));
    })
  }

}
