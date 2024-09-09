import { Constants } from "@multiversx/sdk-nestjs-common";
import moment from "moment";

export class CacheInfo {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

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
  static CSVHeaders(csvFileName: string) {
    return {
      key: `csv-headers-${csvFileName}`,
      ttl: Constants.oneDay(),
    };
  }
}

