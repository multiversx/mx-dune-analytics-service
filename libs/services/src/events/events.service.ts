import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities/event.log";
import moment from "moment";
import BigNumber from "bignumber.js";
import { AddLiquidityEvent, RemoveLiquidityEvent } from "@multiversx/sdk-exchange";
import { createObjectCsvWriter } from 'csv-writer';

interface InnerDictionary {
    [key: string]: BigInt;
}

interface OuterDictionary {
    [key: string]: InnerDictionary;
}
@Injectable()
export class EventsService {
    addresses: OuterDictionary = {}
    firstTokenPrices: Array<{}> = [];
    secondTokenPrices: Array<{}> = [];

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
        /// TODO: fetch prices of tokens
        
        const firstTokenReservePrice = firstTokenReserves.multipliedBy(this.htm.price);
        const secondTokenReservePrice = secondTokenReserves.multipliedBy(this.wegld.price);
        return firstTokenReservePrice.plus(secondTokenReservePrice).shiftedBy(-18);
    }
}