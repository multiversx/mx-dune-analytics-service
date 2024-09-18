import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities";
import BigNumber from "bignumber.js";
import { CsvRecordsService } from "../records";
import moment from "moment";
import { DataService } from "../data";
import { TableSchema } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { borrowEvent, decodeTopics, HatomEvent, joinCsvAttributes } from "libs/services/utils";

interface BorrowEvent extends HatomEvent {
    eventName: string;
    borrowerAddress: string;
    amount: BigNumber;
    newAccountBorrow: BigNumber;
    newTotalBorrows: BigNumber;
    newBorrowerIndex: BigNumber;
}

@Injectable()
export class HatomBorrowEventsService {
    private readonly headers: TableSchema[] = [
        { name: 'borrower_address', type: 'varchar' },
        { name: 'timestamp', type: 'varchar' },
        { name: 'borrowed_amount', type: 'double' },
        { name: 'borrowed_amount_in_egld', type: 'double' },
        { name: 'borrowed_amount_in_usd', type: 'double' },
        { name: 'total_borrowed', type: 'double' },
        { name: 'account_borrowed', type: 'double' },
        { name: 'borrowed_token', type: 'varchar' },
    ];
    constructor(
        private readonly csvRecordsService: CsvRecordsService,
        private readonly dataService: DataService,
    ) { }

    public async hatomBorrowWebhook(eventsLog: EventLog[], borrowedToken: string): Promise<void> {
        for (const eventLog of eventsLog) {
            if (eventLog.identifier === "borrow" && eventLog.topics[0] === borrowEvent) {
                const properties: string[] = ["eventName", "borrowerAddress", "amount", "newAccountBorrow", "newTotalBorrows", "newBorrowerIndex"];
                const types: string[] = ["String", "Address", "BigNumber", "BigNumber", "BigNumber", "BigNumber"];
                const currentEvent: BorrowEvent = decodeTopics(properties, eventLog.topics, types) as BorrowEvent;
                const eventDate = moment.unix(eventLog.timestamp);

                const [borrowedAmountInEGLD, borrowedAmountInUSD] = await this.convertBorrowedAmount(currentEvent, borrowedToken, eventDate);
                const tokenPrecision = await this.dataService.getTokenPrecision(borrowedToken);

                await this.csvRecordsService.pushRecord(
                    `hatom_borrow_events`,
                    [
                        joinCsvAttributes(
                            currentEvent.borrowerAddress,
                            eventDate.format('YYYY-MM-DD HH:mm:ss.SSS'),
                            currentEvent.amount.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            borrowedAmountInEGLD.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            borrowedAmountInUSD.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            currentEvent.newTotalBorrows.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            currentEvent.newAccountBorrow.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            borrowedToken,
                        ),
                    ],
                    this.headers
                );
            }
        }
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
