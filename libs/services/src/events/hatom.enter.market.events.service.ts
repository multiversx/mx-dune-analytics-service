import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities";
import { Address } from "@multiversx/sdk-core";
import BigNumber from "bignumber.js";
import { CsvRecordsService } from "../records";
import moment from "moment";
import { DataService } from "../data";
import { TableSchema } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { joinCsvAttributes } from "libs/services/utils";

interface BorrowEvent {
    eventName: string;
    moneyMarket: string;
    borrowerAddress: string;
    amount: BigNumber;
}

@Injectable()
export class HatomEnterMarketEventsService {
    private readonly headers: TableSchema[] = [
        { name: 'timestamp', type: 'varchar' },
        { name: 'money_market', type: 'varchar' },
        { name: 'token_amount', type: 'double' },
        { name: 'token_id', type: 'varchar' },
        { name: 'borrower_address', type: 'varchar' },
        { name: 'value_in_egld', type: 'double' },
        { name: 'value_in_usd', type: 'double' },
    ];
    constructor(
        private readonly csvRecordsService: CsvRecordsService,
        private readonly dataService: DataService,
    ) { }

    public async hatomEnterMarketWebhook(eventsLog: EventLog[]): Promise<void> {

        for (const eventLog of eventsLog) {
            const enterMarketEventInHex = '656e7465725f6d61726b65745f6576656e74'; // 'enter_market_event'

            if (eventLog.identifier === "enterMarkets" && eventLog.topics[0] === enterMarketEventInHex) {
                const currentEvent = this.decodeTopics(eventLog);
                const eventDate = moment.unix(eventLog.timestamp);
                const tokenID = this.getTokenIdByMoneyMarket(currentEvent.moneyMarket);
                if (tokenID === 'Not Found') {
                    continue;
                }


                const [valueInEgld, valueInUsd] = await this.convertTokenValue(currentEvent, tokenID, eventDate);
                const tokenPrecision = await this.dataService.getTokenPrecision(tokenID);

                await this.csvRecordsService.pushRecord(
                    `hatom_enter_market_events`,
                    [
                        joinCsvAttributes(
                            eventDate.format('YYYY-MM-DD HH:mm:ss.SSS'),
                            currentEvent.moneyMarket,
                            currentEvent.amount.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            tokenID,
                            currentEvent.borrowerAddress,
                            valueInEgld.shiftedBy(-tokenPrecision).decimalPlaces(4),
                            valueInUsd.shiftedBy(-tokenPrecision).decimalPlaces(4),
                        ),
                    ],
                    this.headers,
                );
            }
        }
    }

    decodeTopics(eventLog: EventLog): BorrowEvent {
        const currentEvent: BorrowEvent = {
            eventName: Buffer.from(eventLog.topics[0], 'hex').toString(),
            moneyMarket: Address.newFromHex(Buffer.from(eventLog.topics[1], 'hex').toString('hex')).toBech32(),
            borrowerAddress: Address.newFromHex(Buffer.from(eventLog.topics[2], 'hex').toString('hex')).toBech32(),
            amount: BigNumber(Buffer.from(eventLog.topics[3], 'hex').toString('hex'), 16),
        };

        return currentEvent;
    }

    async convertTokenValue(currentEvent: BorrowEvent, tokenID: string, date: moment.Moment): Promise<[BigNumber, BigNumber]> {
        const egldPrice = await this.dataService.getTokenPrice('WEGLD-bd4d79', date);
        const tokenPrice = await this.dataService.getTokenPrice(tokenID, date, 'hatom');

        const valueInUsd = currentEvent.amount.multipliedBy(tokenPrice);
        const valueInEgld = valueInUsd.dividedBy(egldPrice);

        return [valueInEgld, valueInUsd];
    }

    getTokenIdByMoneyMarket(moneyMarket: string) {
        switch (moneyMarket) {
            case 'erd1qqqqqqqqqqqqqpgqta0tv8d5pjzmwzshrtw62n4nww9kxtl278ssspxpxu':
                return 'HUTK-4fa4b2';
            case 'erd1qqqqqqqqqqqqqpgqkrgsvct7hfx7ru30mfzk3uy6pxzxn6jj78ss84aldu':
                return 'HUSDC-d80042';
            case 'erd1qqqqqqqqqqqqqpgqvxn0cl35r74tlw2a8d794v795jrzfxyf78sstg8pjr':
                return 'HUSDT-6f0914';
            case 'erd1qqqqqqqqqqqqqpgqxmn4jlazsjp6gnec95423egatwcdfcjm78ss5q550k':
                return 'HSEGLD-c13a4e';
            case 'erd1qqqqqqqqqqqqqpgq35qkf34a8svu4r2zmfzuztmeltqclapv78ss5jleq3':
                return 'HEGLD-d61095';
            case 'erd1qqqqqqqqqqqqqpgqz9pvuz22qvqxfqpk6r3rluj0u2can55c78ssgcqs00':
                return 'HWTAO-2e9136';
            case 'erd1qqqqqqqqqqqqqpgqxerzmkr80xc0qwa8vvm5ug9h8e2y7jgsqk2svevje0':
                return 'HHTM-e03ba5';
            case 'erd1qqqqqqqqqqqqqpgq8h8upp38fe9p4ny9ecvsett0usu2ep7978ssypgmrs':
                return 'HWETH-b3d17e';
            case 'erd1qqqqqqqqqqqqqpgqg47t8v5nwzvdxgf6g5jkxleuplu8y4f678ssfcg5gy':
                return 'HWBTC-49ca31';
            case 'erd1qqqqqqqqqqqqqpgqdvrqup8k9mxvhvnc7cnzkcs028u95s5378ssr9d72p':
                return 'HBUSD-ac1fca';
            case 'erd1qqqqqqqqqqqqqpgq7sspywe6e2ehy7dn5dz00ved3aa450mv78ssllmln6':
                return 'HSWTAO-6df80c';
            default:
                return "Not Found";
        }
    }
}



