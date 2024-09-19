import { EventProcessor, EventProcessorOptions } from './event.processor';

const eventsProcessor = new EventProcessor();

void eventsProcessor.start(new EventProcessorOptions({
  elasticUrl: 'https://index.multiversx.com',
  eventIdentifiers: ['ESDTTransfer'],
  emitterAddresses: ['erd1z08z0svvqs84dnrh5hrm47agcxmch79fslmupzgqcgfdtpp3slwqlna25a'],
  pageSize: 3,
  getLastProcessedTimestamp: async () => {
    await Promise.resolve();
    return 1726700632;
  },
  onEventsReceived: async (highestTimestamp, events) => {
    await Promise.resolve();
    console.log(`onEventsReceived -> highestTimestamp: ${highestTimestamp}`);
    console.log(`onEventsReceived -> events: ${JSON.stringify(events)}`);
  },
}));
