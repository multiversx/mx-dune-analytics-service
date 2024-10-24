import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/events-processor/src/processor/entities";
import moment from "moment";
import BigNumber from "bignumber.js";
import { AddLiquidityEvent, RemoveLiquidityEvent } from "@multiversx/sdk-exchange";
import { DataService } from "../data";
import { CsvRecordsService } from "../records";
import { TableSchema } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { joinCsvAttributes } from "libs/services/utils";

@Injectable()
export class LiquidityEventsService {
  private lastFirstTokenReserves: { [key: string]: BigNumber } = {};
  private lastSecondTokenReserves: { [key: string]: BigNumber } = {};

  private lastDate: { [key: string]: moment.Moment } = {};
  private readonly headers: TableSchema[] = [
    { name: 'timestamp', type: 'varchar' },
    { name: 'volumeusd', type: 'double' },
  ];
  constructor(
    private readonly dataService: DataService,
    private readonly csvRecordsService: CsvRecordsService,
  ) { }

  public async liquidityWebhook(eventsLog: EventLog[]): Promise<void> {
    let currentEvent: AddLiquidityEvent | RemoveLiquidityEvent;

    for (const eventLog of eventsLog) {
      // We need to parse an event only when we receive data from events-log-service

      // eventLog.topics = eventLog.topics.map((topic) => Buffer.from(topic, 'hex').toString('base64'));
      // eventLog.data = Buffer.from(eventLog.data, 'hex').toString('base64');
      // eventLog.additionalData = eventLog.additionalData.map((data) => Buffer.from(data, 'hex').toString('base64'));

      switch (eventLog.identifier) {
        case "addLiquidity":
          currentEvent = new AddLiquidityEvent(eventLog);
          break;
        case "removeLiquidity":
          currentEvent = new RemoveLiquidityEvent(eventLog);
          break;
        default:
          continue;
      }

      const firstTokenId = currentEvent.getFirstToken()?.tokenID ?? "";
      const secondTokenId = currentEvent.getSecondToken()?.tokenID ?? "";
      const csvFileName = `${firstTokenId}_${secondTokenId}`;
      const eventDate = moment.unix(currentEvent.getTimestamp()?.toNumber() ?? 0);

      if (this.lastDate[csvFileName]) {
        const diff = this.computeHoursDifference(eventDate, this.lastDate[csvFileName]);

        for (let i = 0; i < diff; i++) {
          this.lastDate[csvFileName].add(1, 'hour').startOf('hour');
          const liquidity = await this.computeLiquidty(this.lastFirstTokenReserves[csvFileName], this.lastSecondTokenReserves[csvFileName], firstTokenId, secondTokenId, this.lastDate[csvFileName]);
          await this.csvRecordsService.pushRecords(
            csvFileName,
            [
              joinCsvAttributes(
                this.lastDate[csvFileName].format('YYYY-MM-DD HH:mm:ss.SSS'),
                liquidity.decimalPlaces(4),
              ),
            ],
            this.headers);
        }
      }

      this.lastFirstTokenReserves[csvFileName] = currentEvent.getFirstTokenReserves() ?? new BigNumber(0);
      this.lastSecondTokenReserves[csvFileName] = currentEvent.getSecondTokenReserves() ?? new BigNumber(0);
      this.lastDate[csvFileName] = eventDate;
    }
  }

  private computeHoursDifference(currentDate: moment.Moment, previousDate: moment.Moment): number {
    let diff = currentDate.diff(previousDate, 'hours');

    if (previousDate.minutes() > currentDate.minutes()) {
      diff++;
    }

    return diff;
  }

  private async computeLiquidty(firstTokenReserves: BigNumber, secondTokenReserves: BigNumber, firstTokenId: string, secondTokenId: string, date: moment.Moment): Promise<BigNumber> {
    const firstTokenPrice = await this.dataService.getTokenPrice(firstTokenId, date);
    const secondTokenPrice = await this.dataService.getTokenPrice(secondTokenId, date);

    const firstTokenPrecision = await this.dataService.getTokenPrecision(firstTokenId);
    const secondTokenPrecision = await this.dataService.getTokenPrecision(secondTokenId);

    const firstTokenReservePrice = firstTokenReserves.multipliedBy(firstTokenPrice).shiftedBy(-firstTokenPrecision);
    const secondTokenReservePrice = secondTokenReserves.multipliedBy(secondTokenPrice).shiftedBy(-secondTokenPrecision);

    return firstTokenReservePrice.plus(secondTokenReservePrice);
  }
}
