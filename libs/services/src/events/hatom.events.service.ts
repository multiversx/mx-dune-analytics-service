import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities";
import { Address } from "@multiversx/sdk-core";
import BigNumber from "bignumber.js";
import { CsvRecordsService } from "../records";
import moment from "moment";
import { DataService } from "../data";

interface BorrowEvent {
    eventName: string;
    borrowerAddress: string;
    amount: BigNumber;
    newAccountBorrow: BigNumber;
    newTotalBorrows: BigNumber;
    newBorrowerIndex: BigNumber;
}

@Injectable()
export class HatomEventsService {
    constructor(
        private readonly csvRecordsService: CsvRecordsService,
        private readonly dataService: DataService,
    ) { }

    public async hatomWebhook(eventsLog: EventLog[], borrowedToken: string): Promise<void> {

        for (const eventLog of eventsLog) {
            // We need to parse an event only when we receive data from events-log-service
            // eventLog.topics = eventLog.topics.map((topic) => Buffer.from(topic, 'hex').toString('base64'));
            if (eventLog.identifier === "borrow" && eventLog.topics[0] === '626f72726f775f6576656e74') // borrow_event
            {
                const currentEvent = this.decodeTopics(eventLog);
                const eventDate = moment.unix(eventLog.timestamp);
                const headers = ['borrowerAddress', 'timestamp', 'borrowedAmount', 'borrowedAmountInEGLD', 'borrowedAmountInUSD', 'totalBorrowed', 'accountBorrowed', 'borrowedToken'];

                const [borrowedAmountInEGLD, borrowedAmountInUSD] = await this.convertBorrowedAmount(currentEvent, borrowedToken, eventDate);
                const tokenPrecision = await this.dataService.getTokenPrecision(borrowedToken);

                await this.csvRecordsService.pushRecord(`hatomEvents`,
                    [`${currentEvent.borrowerAddress},${eventDate.format('YYYY-MM-DD HH:mm:ss.SSS')},${currentEvent.amount.shiftedBy(-tokenPrecision).decimalPlaces(4)},${borrowedAmountInEGLD.shiftedBy(-tokenPrecision).decimalPlaces(4)},${borrowedAmountInUSD.shiftedBy(-tokenPrecision).decimalPlaces(4)},${currentEvent.newTotalBorrows.shiftedBy(-tokenPrecision).decimalPlaces(4)},${currentEvent.newAccountBorrow.shiftedBy(-tokenPrecision).decimalPlaces(4)},${borrowedToken}`],
                    headers);
                // await this.csvRecordsService.pushRecord(`borrows_for_${currentEvent.borrowerAddress}`, [`${eventDate.format('YYYY-MM-DD HH:mm:ss.SSS')},${currentEvent.newAccountBorrow.shiftedBy(-5).decimalPlaces(4)}`],);
            }

        }
    }

    decodeTopics(eventLog: EventLog): BorrowEvent {
        const currentEvent: BorrowEvent = {
            eventName: Buffer.from(eventLog.topics[0], 'hex').toString(),
            borrowerAddress: Address.newFromHex(Buffer.from(eventLog.topics[1], 'hex').toString('hex')).toBech32(),
            amount: BigNumber(Buffer.from(eventLog.topics[2], 'hex').toString('hex'), 16),
            newAccountBorrow: BigNumber(Buffer.from(eventLog.topics[3], 'hex').toString('hex'), 16),
            newTotalBorrows: BigNumber(Buffer.from(eventLog.topics[4], 'hex').toString('hex'), 16),
            newBorrowerIndex: BigNumber(Buffer.from(eventLog.topics[5], 'hex').toString('hex'), 16),
        };

        return currentEvent;
    }

    async convertBorrowedAmount(currentEvent: BorrowEvent, borrowedToken: string, date: moment.Moment): Promise<[BigNumber, BigNumber]> {
        let borrowedAmountInEGLD, borrowedAmountInUSD;

        const egldPrice = await this.dataService.getTokenPrice('WEGLD-bd4d79', date);
        if (borrowedToken === 'WEGLD-bd4d79') {
            borrowedAmountInEGLD = currentEvent.amount;
            borrowedAmountInUSD = borrowedAmountInEGLD.multipliedBy(egldPrice);
        } else {
            borrowedAmountInUSD = currentEvent.amount;
            borrowedAmountInEGLD = borrowedAmountInUSD.dividedBy(egldPrice);
        }
        return [borrowedAmountInEGLD, borrowedAmountInUSD];
    }
}


