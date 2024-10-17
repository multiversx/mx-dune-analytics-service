import { Injectable } from '@nestjs/common';
import { EventLog } from '../../../../../apps/events-processor/src/processor/entities';
// eslint-disable-next-line no-restricted-imports
import { SetStatusEvent, TransferPerformedEvent } from '@libs/services/events/bridge/bridge.event';
import moment from 'moment/moment';
import { joinCsvAttributes } from '../../../utils';
import { TableSchema } from '../../../../../apps/dune-simulator/src/endpoints/dune-simulator/entities';
// eslint-disable-next-line no-restricted-imports
import { CsvRecordsService } from '@libs/services/records';
// import moment from "moment";
// import BigNumber from "bignumber.js";
// import { DataService } from "../data";
// import { CsvRecordsService } from "../records";
// import { TableSchema } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
//import { joinCsvAttributes } from "libs/services/utils";

class Transaction {
  from: string;
  to: string;
  tokenId: string;
  value: string;
  date: string;
  sourceChain: string;
  destinationChain: string;

  constructor() {
    this.from = '';
    this.to = '';
    this.tokenId = '';
    this.value = '';
    this.date = '';
    this.sourceChain = '';
    this.destinationChain = '';
  }

  static headers(): TableSchema[] {
    return [
      { name: 'from', type: 'varchar' },
      { name: 'to', type: 'varchar' },
      { name: 'token_id', type: 'varchar' },
      { name: 'value', type: 'double' },
      { name: 'date', type: 'varchar' },
      { name: 'source_chain', type: 'varchar' },
      { name: 'destination_chain', type: 'varchar' },
    ];
  }

  toRecord(): string[] {
    return [
      this.from,
      this.to,
      this.tokenId,
      this.value,
      this.date,
      this.sourceChain,
      this.destinationChain,
    ];
  }
}


@Injectable()
export class BridgeEventsService {
  constructor(
    private readonly csvRecordsService: CsvRecordsService,
  ) {}

  public async bridgeMvxEthWebhook(eventsLog: EventLog[]): Promise<void>{
    for (const rawEvent of eventsLog) {

      if (rawEvent.topics.length < 5) {
        continue;
      }

      const event = new SetStatusEvent(rawEvent);
      if ( event.name !== "setStatusEvent"){
        continue;
      }

      const topics = event.getTopics();
      if (topics.status !== "Executed"){
        continue;
      }

      const eventDate = moment.unix(rawEvent.timestamp);
      const tx = new Transaction();
      tx.from = topics.mvxAddress;
      tx.to = topics.ethAddress;
      tx.tokenId = topics.tokenId;
      tx.value = topics.amount;
      tx.date = eventDate.format('YYYY-MM-DD HH:mm:ss.SSS');
      tx.sourceChain = "MVX";
      tx.destinationChain = "ETH";
      await this.csvRecordsService.pushRecord(
        `bridge_events`,
        [
          joinCsvAttributes(tx.toRecord()),
        ],
        Transaction.headers()
      );
    }
  }

  public async bridgeEthMvxWebhook(eventsLog: EventLog[]): Promise<void>{
    for (const rawEvent of eventsLog) {
      const event = new TransferPerformedEvent(rawEvent);

      if ( event.name !== "transferPerformedEvent"){
        continue;
      }
      const topics = event.getTopics();
      const eventDate = moment.unix(rawEvent.timestamp);
      const tx = new Transaction();
      tx.from = topics.ethAddress;
      tx.to = topics.mvxAddress;
      tx.tokenId = topics.tokenId;
      tx.value = topics.amount;
      tx.date = eventDate.format('YYYY-MM-DD HH:mm:ss.SSS');
      tx.sourceChain = "ETH";
      tx.destinationChain = "MVX";

      await this.csvRecordsService.pushRecord(
        `bridge_events`,
        [
          joinCsvAttributes(tx.toRecord()),
        ],
        Transaction.headers()
      );
    }
  }
}
