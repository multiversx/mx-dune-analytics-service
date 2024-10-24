import { DynamicCollectionRepository } from "@libs/database/collections";
import { EventProcessor, EventProcessorOptions } from "./event.processor";
import { Locker } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EventLog } from "apps/events-processor/src/processor/entities";
import { HatomBorrowEventsService, HatomEnterMarketEventsService } from "../events";
import { ShutdownAwareHandler } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class ProcessorService {
  constructor(
    private readonly dynamicCollectionService: DynamicCollectionRepository,
    private readonly hatomEnterMarketService: HatomEnterMarketEventsService,
    private readonly hatomBorrowService: HatomBorrowEventsService,
  ) { }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleHatomEnterMarketEvents() {
    await Locker.lock('hatom-enter-market', async () => {
      const eventProcessorOptions = new EventProcessorOptions({
        elasticUrl: 'https://index.multiversx.com',
        eventIdentifiers: ['enterMarkets'],
        emitterAddresses: ['erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr'],
        pageSize: 250,
        getLastProcessedTimestamp: async () => {
          return await this.dynamicCollectionService.getLastProcessedTimestamp('hatom-enter-market');
        },
        setLastProcessedTimestamp: async (nonce) => {
          await this.dynamicCollectionService.setLastProcessedTimestamp('hatom-enter-market', nonce);
        },
        onEventsReceived: async (highestTimestamp, events) => {
          highestTimestamp;
          await this.hatomEnterMarketService.hatomEnterMarketParser(events as EventLog[]);
        },
      });

      const eventProcessor = new EventProcessor();
      await ShutdownAwareHandler.executeCriticalTask(async () => {
        await eventProcessor.start(eventProcessorOptions);
      });
    });
  }


  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleHatomBorrowEventsUSDT() {
    await Locker.lock('hatom-borrow-USDT-f8c08c', async () => {
      const eventProcessorOptions = new EventProcessorOptions({
        elasticUrl: 'https://index.multiversx.com',
        eventIdentifiers: ['borrow'],
        emitterAddresses: ['erd1qqqqqqqqqqqqqpgqkrgsvct7hfx7ru30mfzk3uy6pxzxn6jj78ss84aldu'],
        pageSize: 250,
        getLastProcessedTimestamp: async () => {
          return await this.dynamicCollectionService.getLastProcessedTimestamp('hatom-borrow-USDT-f8c08c');
        },
        setLastProcessedTimestamp: async (nonce) => {
          await this.dynamicCollectionService.setLastProcessedTimestamp('hatom-borrow-USDT-f8c08c', nonce);
        },
        onEventsReceived: async (highestTimestamp, events) => {
          highestTimestamp;
          await this.hatomBorrowService.hatomBorrowParser(events as EventLog[], 'USDT-f8c08c');
        },
      });
      const eventProcessor = new EventProcessor();
      await ShutdownAwareHandler.executeCriticalTask(async () => {
        await eventProcessor.start(eventProcessorOptions);
      });
    });
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleHatomUsdcBorrowEventsUSDC() {
    await Locker.lock('hatom-borrow-USDC-c76f1f', async () => {
      const eventProcessorOptions = new EventProcessorOptions({
        elasticUrl: 'https://index.multiversx.com',
        eventIdentifiers: ['borrow'],
        emitterAddresses: ['erd1qqqqqqqqqqqqqpgqvxn0cl35r74tlw2a8d794v795jrzfxyf78sstg8pjr'],
        pageSize: 250,
        getLastProcessedTimestamp: async () => {
          return await this.dynamicCollectionService.getLastProcessedTimestamp('hatom-borrow-USDC-c76f1f');
        },
        setLastProcessedTimestamp: async (nonce) => {
          await this.dynamicCollectionService.setLastProcessedTimestamp('hatom-borrow-USDC-c76f1f', nonce);
        },
        onEventsReceived: async (highestTimestamp, events) => {
          highestTimestamp;
          await this.hatomBorrowService.hatomBorrowParser(events as EventLog[], 'USDC-c76f1f');
        },
      });
      const eventProcessor = new EventProcessor();
      await ShutdownAwareHandler.executeCriticalTask(async () => {
        await eventProcessor.start(eventProcessorOptions);
      });
    });
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleHatomBorrowEventsWEGLD() {
    await Locker.lock('hatom-borrow-WEGLD-bd4d79', async () => {
      const eventProcessorOptions = new EventProcessorOptions({
        elasticUrl: 'https://index.multiversx.com',
        eventIdentifiers: ['borrow'],
        emitterAddresses: ['erd1qqqqqqqqqqqqqpgq35qkf34a8svu4r2zmfzuztmeltqclapv78ss5jleq3'],
        pageSize: 250,
        getLastProcessedTimestamp: async () => {
          return await this.dynamicCollectionService.getLastProcessedTimestamp('hatom-borrow-WEGLD-bd4d79');
        },
        setLastProcessedTimestamp: async (nonce) => {
          await this.dynamicCollectionService.setLastProcessedTimestamp('hatom-borrow-WEGLD-bd4d79', nonce);
        },
        onEventsReceived: async (highestTimestamp, events) => {
          highestTimestamp;
          await this.hatomBorrowService.hatomBorrowParser(events as EventLog[], 'WEGLD-bd4d79');
        },
      });
      const eventProcessor = new EventProcessor();
      await ShutdownAwareHandler.executeCriticalTask(() => eventProcessor.start(eventProcessorOptions));
    });
  }
}
