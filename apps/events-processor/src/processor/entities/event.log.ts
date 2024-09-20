import { ApiProperty } from "@nestjs/swagger";

export class EventLog {
  constructor(init?: Partial<EventLog>) {
    Object.assign(this, init);
  }
  @ApiProperty()
  eventId: string = '';

  @ApiProperty()
  txHash: string = '';

  @ApiProperty()
  shardId: number = 0;

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  address: string = '';

  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  topics: string[] = [];

  @ApiProperty()
  data: string = '';

  @ApiProperty()
  additionalData: string[] = [];

  @ApiProperty()
  txOrder: number = 0;

  @ApiProperty()
  eventOrder: number = 0;
}

export class EventsLog {
  constructor(init?: Partial<EventsLog>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: EventLog, isArray: true })
  events: EventLog[] = [];
}
