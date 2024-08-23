import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities/event.log";
import moment from "moment";
import BigNumber from "bignumber.js";
import { AddLiquidityEvent, RemoveLiquidityEvent } from "@multiversx/sdk-exchange";
import { createObjectCsvWriter } from 'csv-writer';
import axios from 'axios';

interface InnerDictionary {
    [key: string]: BigInt;
}

interface OuterDictionary {
    [key: string]: InnerDictionary;
}

interface TokenPrice {
    time: string;
    price: string;
}

@Injectable()
export class EventsService {
    addresses: OuterDictionary = {}
    firstTokenPrices: Array<TokenPrice> = [];
    secondTokenPrices: Array<TokenPrice> = [];

    csvWriter = createObjectCsvWriter({
        path: 'out.csv',
        header: [
            {id: 'date', title: 'Date'},
            {id: 'liquidity', title: 'Liquidity'}
        ],
        append: true
    });
    
    lastFirstTokenReserves: BigNumber = new BigNumber(0);
    lastSecondTokenReserves: BigNumber = new BigNumber(0);
    lastDate: moment.Moment = moment.unix(0);

    constructor(
        // private readonly cacheService: CacheService,
    ) { 
        axios.get<Array<TokenPrice>>('https://data-api.multiversx.com/v1/history/xexchange/HTM-f51d55/last_30d?type=price')
            .then((response) => {this.firstTokenPrices = response.data});
        axios.get<Array<TokenPrice>>('https://data-api.multiversx.com/v1/history/xexchange/WEGLD-bd4d79/last_30d?type=price')
            .then((response) => {this.secondTokenPrices = response.data});
    }

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
                    return;
            }
            const date = moment.unix(currentEvent.getTimestamp()?.toNumber() ?? 0)

            if (!this.lastDate.isSame(moment.unix(0))) {
                const diff = this.computeHoursDifference(date, this.lastDate);

                for (let i = 0; i < diff; i++) {
                    const liquidity = this.computeLiquidty(this.lastFirstTokenReserves, this.lastSecondTokenReserves);
                    await this.csvWriter.writeRecords([{date: this.lastDate.add(1, 'hour').format("DD MMMM YYYY HH:00 [UTC]"), liquidity: liquidity}]);
                }
            }

            this.lastFirstTokenReserves = currentEvent.getFirstTokenReserves() ?? new BigNumber(0);
            this.lastSecondTokenReserves = currentEvent.getSecondTokenReserves() ?? new BigNumber(0);
            this.lastDate = date;
        }
    }

    private computeHoursDifference(currentDate: moment.Moment, previousDate: moment.Moment): number {
        let diff = currentDate.diff(previousDate, 'hours');

        if (previousDate.minutes() > currentDate.minutes()) {
            diff++;
        }

        return diff;
    }

    private computeLiquidty(firstTokenReserves: BigNumber, secondTokenReserves: BigNumber): BigNumber {
        const firstTokenPrice = this.firstTokenPrices.find((element) => element.time === this.lastDate.format("YYYY-MM-DD"))?.price ?? 0;
        const secondTokenPrice = this.secondTokenPrices.find((element) => element.time === this.lastDate.format("YYYY-MM-DD"))?.price ?? 0;

        const firstTokenReservePrice = firstTokenReserves.multipliedBy(firstTokenPrice);
        const secondTokenReservePrice = secondTokenReserves.multipliedBy(secondTokenPrice);
        return firstTokenReservePrice.plus(secondTokenReservePrice).shiftedBy(-18);
    }
}