import { TransferPerformedEventTopics } from './bridge.event.topics';
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
