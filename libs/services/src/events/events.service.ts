import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities/event.log";
import moment from "moment";
import BigNumber from "bignumber.js";
import { AddLiquidityEvent, RemoveLiquidityEvent } from "@multiversx/sdk-exchange";
import { createObjectCsvWriter } from 'csv-writer';
// import axios from 'axios';
import { DataService } from "../data";

interface InnerDictionary {
    [key: string]: BigInt;
}

interface OuterDictionary {
    [key: string]: InnerDictionary;
}

// interface TokenPrice {
//     time: string;
//     price: string;
// }

@Injectable()
export class EventsService {
    addresses: OuterDictionary = {}

    lastFirstTokenReserves: { [key: string]: BigNumber } = {};
    lastSecondTokenReserves: { [key: string]: BigNumber } = {};
    lastDate: { [key: string]: moment.Moment } = {};

    constructor(
        // private readonly cacheService: CacheService,
        private readonly dataService: DataService,
    ) {

    }

    public async eventsWebhook(eventsLog: EventLog[]): Promise<void> {
        let currentEvent: AddLiquidityEvent | RemoveLiquidityEvent;

        // const firstTokenPrices = (await axios.get<Array<TokenPrice>>(`https://data-api.multiversx.com/v1/history/xexchange/${firstToken}/last_30d?type=price`)).data;
        // const secondTokenPrices = (await axios.get<Array<TokenPrice>>(`https://data-api.multiversx.com/v1/history/xexchange/${secondToken}/last_30d?type=price`)).data;

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

            const csvWriter = createObjectCsvWriter({
                path: `${firstTokenId}_${secondTokenId}.csv`,
                header: [
                    { id: 'date', title: 'Date' },
                    { id: 'liquidity', title: 'Liquidity' }
                ],
                append: true
            });

            const eventDate = moment.unix(currentEvent.getTimestamp()?.toNumber() ?? 0)

            if (this.lastDate[`${firstTokenId}_${secondTokenId}`]) {
                const diff = this.computeHoursDifference(eventDate, this.lastDate[`${firstTokenId}_${secondTokenId}`]);

                for (let i = 0; i < diff; i++) {
                    const liquidity = await this.computeLiquidty(this.lastFirstTokenReserves[`${firstTokenId}_${secondTokenId}`], this.lastSecondTokenReserves[`${firstTokenId}_${secondTokenId}`], firstTokenId, secondTokenId, this.lastDate[`${firstTokenId}_${secondTokenId}`]);
                    await csvWriter.writeRecords([{ date: this.lastDate[`${firstTokenId}_${secondTokenId}`].add(1, 'hour').format("DD MMMM YYYY HH:00 [UTC]"), liquidity: liquidity }]);
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

        const firstTokenReservePrice = firstTokenReserves.multipliedBy(firstTokenPrice);
        const secondTokenReservePrice = secondTokenReserves.multipliedBy(secondTokenPrice);

        return firstTokenReservePrice.plus(secondTokenReservePrice).shiftedBy(-18);
    }
}