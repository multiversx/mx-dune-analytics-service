import { Address } from '@multiversx/sdk-core';
import BigNumber from 'bignumber.js';

export class TransferPerformedEventTopics {
  readonly eventName: string;
  readonly ethAddress: string;
  readonly mvxAddress: Address;
  readonly tokenId: string;
  readonly amount: string;

  constructor(rawTopics: string[]) {
    this.eventName = Buffer.from(rawTopics[0], 'hex').toString();
    this.mvxAddress = new Address(Buffer.from(rawTopics[3], 'hex'));
    this.ethAddress = '0x' + rawTopics[2];
    this.tokenId = Buffer.from(rawTopics[4], 'hex').toString();
    this.amount =  new BigNumber(rawTopics[5], 16).toString();
  }

  toJSON() {
    return {
      eventName: this.eventName,
      ethAddress: this.ethAddress,
      mvxAddress: this.mvxAddress.bech32(),
      tokenId: this.tokenId,
      amount: this.amount,
    };
  }
}

enum TransactionStatus {
  None = 0,
  Pending = 1,
  InProgress = 2,
  Executed = 3,
  Rejected = 4,
}

export class SetStatusEventTopics {
  readonly eventName: string;
  readonly mvxAddress: Address;
  readonly ethAddress: string;
  readonly tokenId: string;
  readonly amount: string;
  readonly status: string;

  constructor(rawTopics: string[]) {
    this.eventName = Buffer.from(rawTopics[0], 'hex').toString();
    this.mvxAddress = new Address(Buffer.from(rawTopics[2], 'hex'));
    this.ethAddress = '0x' + rawTopics[3];
    this.tokenId = Buffer.from(rawTopics[4], 'hex').toString();
    this.amount =  new BigNumber(rawTopics[5], 16).toString();
    const statusIndex = parseInt(rawTopics[7], 16);
    this.status = TransactionStatus[statusIndex];
  }

  toJSON() {
    return {
      eventName: this.eventName,
      mvxAddress: this.mvxAddress.bech32(),
      ethAddress: this.ethAddress,
      tokenId: this.tokenId,
      amount: this.amount,
      status: this.status,
    };
  }
}
