import { Constants } from "@multiversx/sdk-nestjs-common";

export class CacheInfo {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

  static LastProcessedNonce(shardId: number): CacheInfo {
    return {
      key: `lastProcessedNonce:${shardId}`,
      ttl: Constants.oneMonth(),
    };
  }

  static Examples: CacheInfo = {
    key: "examples",
    ttl: Constants.oneHour(),
  };

  static TokenPrice(tokenId: string, date: moment.Moment) {
    return {
      key: `${tokenId}-${date.format('YYYY-MM-DD')}`,
      ttl: Constants.oneDay(),
    };
  }

  static TokenPrecision(tokenId: string) {
    return {
      key: `precision-${tokenId}`,
      ttl: Constants.oneMonth(),
    };
  }

  static CSVRecord(csvFileName: string) {
    return {
      key: `csv-records-${csvFileName}`,
      ttl: Constants.oneDay(),
    };
  }
}

