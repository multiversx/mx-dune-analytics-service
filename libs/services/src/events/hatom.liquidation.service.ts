import { Injectable } from "@nestjs/common";
import { TableSchema } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { EventLog } from "apps/api/src/endpoints/events/entities";
import { liquidationBorrowEvent } from "../../utils/hex-constants";
import { CsvRecordsService } from "../records";
import { decodeTopics, HatomEvent, joinCsvAttributes } from "libs/services/utils";
import BigNumber from "bignumber.js";
import moment from "moment";

interface LiquidationEvent extends HatomEvent {
    'liquidator': string,
    'borrower': string,
    'amount': BigNumber,
    'collateral_mma': string,
    'tokens': BigNumber,
}

@Injectable()
export class HatomLiquidationService {
    private readonly headers: TableSchema[] = [];

    constructor(
        private readonly csvRecordsService: CsvRecordsService,
    ) {}

    public async hatomLiquidationWebhook(eventsLog: EventLog[]): Promise<void> {
        for (const eventLog of eventsLog) {
            if (eventLog.identifier === "liquidateBorrow" && eventLog.topics[0] === liquidationBorrowEvent) {
                const properties: string[] = ["liquidator", "borrower", "amount", "collateral_mma", "tokens"];
                const types: string[] = ["Address", "Address", "BigNumber", "Address", "BigNumber"];
                const currentEvent: LiquidationEvent = decodeTopics(properties, eventLog.topics.slice(1), types) as LiquidationEvent;
                const eventDate = moment.unix(eventLog.timestamp);

                await this.csvRecordsService.pushRecord("hatom_liquidation_events", [
                    joinCsvAttributes(
                        currentEvent.liquidator,
                        currentEvent.borrower,
                        eventDate.format('YYYY-MM-DD HH:mm:ss.SSS'),
                        currentEvent.amount.shiftedBy(-18).decimalPlaces(4),
                        currentEvent.collateral_mma,
                        currentEvent.tokens.shiftedBy(-18).decimalPlaces(4),
                    ),
                ], this.headers);
            }
        }
    }
}
