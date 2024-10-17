import { SetStatusEventTopics, TransferPerformedEventTopics } from './bridge.event.topics';
import { GenericEvent, RawEventType } from '@multiversx/sdk-exchange';

export class TransferPerformedEvent extends GenericEvent {
  private decodedTopics: TransferPerformedEventTopics;
  protected decodedEvent: any;

  constructor(init: RawEventType) {
    super(init);

    this.decodedTopics = new TransferPerformedEventTopics(this.topics);
    this.name = this.decodedTopics.eventName;
  }

  getTopics() {
    return this.decodedTopics.toJSON();
  }
}

export class SetStatusEvent extends GenericEvent {
  private decodedTopics: SetStatusEventTopics;
  protected decodedEvent: any;

  constructor(init: RawEventType) {
    super(init);

    this.decodedTopics = new SetStatusEventTopics(this.topics);
    this.name = this.decodedTopics.eventName;
  }

  getTopics() {
    return this.decodedTopics.toJSON();
  }
}
