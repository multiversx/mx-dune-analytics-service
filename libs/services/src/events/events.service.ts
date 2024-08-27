import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities";
import moment from "moment";
import BigNumber from "bignumber.js";
import { AddLiquidityEvent, RemoveLiquidityEvent } from "@multiversx/sdk-exchange";
// import { createObjectCsvWriter } from 'csv-writer';
import { DataService } from "../data";
import { CsvWriter } from "csv-writer/src/lib/csv-writer";
import { ObjectMap } from "csv-writer/src/lib/lang/object";
// import * as fs from 'fs';

interface InnerDictionary {
    [key: string]: BigInt;
}

interface OuterDictionary {
    [key: string]: InnerDictionary;
}

type CsvRecords = Record<string, [string]>
@Injectable()
export class EventsService {
    addresses: OuterDictionary = {};

    lastFirstTokenReserves: { [key: string]: BigNumber } = {};
    lastSecondTokenReserves: { [key: string]: BigNumber } = {};
    lastDate: { [key: string]: moment.Moment } = {};

    csvWriters: { [key: string]: CsvWriter<ObjectMap<any>> } = {};
    csvRecords: CsvRecords = {};
    constructor(
        private readonly dataService: DataService,
    ) { }

    public async eventsWebhook(eventsLog: EventLog[]): Promise<void> {
        let currentEvent: AddLiquidityEvent | RemoveLiquidityEvent;

        for (const eventLog of eventsLog) {
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

            // let csvWriter = null;
            // if (!this.csvWriters[`${firstTokenId}_${secondTokenId}`]) {
            //     csvWriter = createObjectCsvWriter({
            //         path: `out_csv/${firstTokenId}_${secondTokenId}.csv`,
            //         header: [
            //             { id: 'timestamp', title: 'timestamp' },
            //             { id: 'volumeusd', title: 'volumeusd' },
            //         ],
            //         append: true,
            //     });
            //     this.csvWriters[`${firstTokenId}_${secondTokenId}`] = csvWriter;
            //     if (!fs.existsSync(`out_csv/${firstTokenId}_${secondTokenId}.csv`)) {
            //         await csvWriter.writeRecords([{ timestamp: 'timestamp', volumeusd: 'volumeusd' }]);
            //     }
            // } else {
            //     csvWriter = this.csvWriters[`${firstTokenId}_${secondTokenId}`];
            // }
            if (!this.csvRecords[`${firstTokenId}_${secondTokenId}`]) {
                this.csvRecords[`${firstTokenId}_${secondTokenId}`] = ["timestamp,volumeusd"];
            }

            const eventDate = moment.unix(currentEvent.getTimestamp()?.toNumber() ?? 0);

            if (this.lastDate[`${firstTokenId}_${secondTokenId}`]) {
                const diff = this.computeHoursDifference(eventDate, this.lastDate[`${firstTokenId}_${secondTokenId}`]);

                for (let i = 0; i < diff; i++) {
                    this.lastDate[`${firstTokenId}_${secondTokenId}`].add(1, 'hour').startOf('hour');
                    const liquidity = await this.computeLiquidty(this.lastFirstTokenReserves[`${firstTokenId}_${secondTokenId}`], this.lastSecondTokenReserves[`${firstTokenId}_${secondTokenId}`], firstTokenId, secondTokenId, this.lastDate[`${firstTokenId}_${secondTokenId}`]);
                    this.csvRecords[`${firstTokenId}_${secondTokenId}`].push(`${this.lastDate[`${firstTokenId}_${secondTokenId}`].format('YYYY-MM-DD HH:mm:ss.SSS')},${liquidity.decimalPlaces(4)}`);
                    // await csvWriter.writeRecords([{ timestamp: this.lastDate[`${firstTokenId}_${secondTokenId}`].format('YYYY-MM-DD HH:mm:ss.SSS'), volumeusd: liquidity.decimalPlaces(4) }]);
                }
            }

            this.lastFirstTokenReserves[`${firstTokenId}_${secondTokenId}`] = currentEvent.getFirstTokenReserves() ?? new BigNumber(0);
            this.lastSecondTokenReserves[`${firstTokenId}_${secondTokenId}`] = currentEvent.getSecondTokenReserves() ?? new BigNumber(0);
            this.lastDate[`${firstTokenId}_${secondTokenId}`] = eventDate;
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
