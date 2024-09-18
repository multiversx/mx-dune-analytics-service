import { Injectable, Logger } from "@nestjs/common";
import { TableSchema } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { EventLog } from "apps/api/src/endpoints/events/entities";
import { CsvRecordsService } from "../records";
import { liquidationBorrowEvent, decodeTopics, getTokenIdByMoneyMarket, HatomEvent, joinCsvAttributes } from "libs/services/utils";
import BigNumber from "bignumber.js";
import moment from "moment";
import { DataService } from "../data";

interface LiquidationEvent extends HatomEvent {
    liquidator: string,
    borrower: string,
    amount: BigNumber,
    collateral_mma: string,
    tokens: BigNumber,
}

@Injectable()
export class HatomLiquidationService {
    private readonly headers: TableSchema[] = [
        { name: "timestamp", type: "varchar" },
        { name: 'liquidator', type: 'varchar' },
        { name: 'account_liquidated', type: 'varchar' },
        { name: 'token', type: 'varchar' },
        { name: 'amount', type: 'double' },
        { name: 'amount_in_egld', type: 'double' },
        { name: 'amount_in_usd', type: 'double' },
    ];

    constructor(
        private readonly csvRecordsService: CsvRecordsService,
        private readonly dataService: DataService,
    ) {}

    public async hatomLiquidationWebhook(eventsLog: EventLog[]): Promise<void> {
        for (const eventLog of eventsLog) {
            if (eventLog.identifier === "liquidateBorrow" && eventLog.topics[0] === liquidationBorrowEvent) {
                const properties: string[] = ["liquidator", "borrower", "amount", "collateral_mma", "tokens"];
                const types: string[] = ["Address", "Address", "BigNumber", "Address", "BigNumber"];
                const currentEvent: LiquidationEvent = decodeTopics(properties, eventLog.topics.slice(1), types) as LiquidationEvent;
                const eventDate = moment.unix(eventLog.timestamp);

                const tokenId: string | undefined = getTokenIdByMoneyMarket(currentEvent.collateral_mma);

                if (tokenId === undefined) {
                    Logger.warn(`Token ID not found for collateral MMA: ${currentEvent.collateral_mma}`);
                    continue;
                }

                const tokenPrecision = await this.dataService.getTokenPrecision(tokenId);
                const [liquidatedAmountInEGLD, liquidatedAmountInUSD] = await this.convertTokenValue(currentEvent.tokens, tokenId, eventDate);

                await this.csvRecordsService.pushRecord(
                    "hatom_liquidation_events", 
                    [
                        joinCsvAttributes(
                            eventDate.format('YYYY-MM-DD HH:mm:ss.SSS'),
                            currentEvent.liquidator,
                            currentEvent.borrower,
                            tokenId,
                            currentEvent.tokens.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            liquidatedAmountInEGLD.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            liquidatedAmountInUSD.shiftedBy(-tokenPrecision).decimalPlaces(4),
                        ),
                    ], 
                    this.headers
                );
            }
        }
    }

    async convertTokenValue(amount: BigNumber, tokenID: string, date: moment.Moment): Promise<[BigNumber, BigNumber]> {
        const egldPrice = await this.dataService.getTokenPrice('WEGLD-bd4d79', date);
        const tokenPrice = await this.dataService.getTokenPrice(tokenID, date, 'hatom');

        const valueInUsd = amount.multipliedBy(tokenPrice);
        const valueInEgld = valueInUsd.dividedBy(egldPrice);

        return [valueInEgld, valueInUsd];
    }
}
