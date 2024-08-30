import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities";
import moment from "moment";
import BigNumber from "bignumber.js";
import { AddLiquidityEvent, RemoveLiquidityEvent } from "@multiversx/sdk-exchange";
import { DataService } from "../data";
import { CsvRecordsService } from "../records";

@Injectable()
export class EventsService {
    lastFirstTokenReserves: { [key: string]: BigNumber } = {};
    lastSecondTokenReserves: { [key: string]: BigNumber } = {};

    lastDate: { [key: string]: moment.Moment } = {};

    constructor(
        private readonly dataService: DataService,
        private readonly csvRecordsService: CsvRecordsService,
    ) { }

    public async eventsWebhook(eventsLog: EventLog[]): Promise<void> {
        let currentEvent: AddLiquidityEvent | RemoveLiquidityEvent;

        for (const eventLog of eventsLog) {
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
                    await this.csvRecordsService.pushRecord(csvFileName, [`${this.lastDate[csvFileName].format('YYYY-MM-DD HH:mm:ss.SSS')},${liquidity.decimalPlaces(4)}`]);
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
