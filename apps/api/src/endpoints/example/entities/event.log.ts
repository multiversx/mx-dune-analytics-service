export class EventLog {
  constructor(init?: Partial<EventLog>) {
    Object.assign(this, init);
  }
  eventId: string = '';
  txHash: string = '';
  shardId: number = 0;
  timestamp: number = 0;
  address: string = '';
  identifier: string = '';
  topics: string[] = [];
  data: string = '';
  additionalData: string[] = [];
  txOrder: number = 0;
  eventOrder: number = 0;
}
