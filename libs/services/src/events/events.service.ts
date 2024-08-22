import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities/event.log";
import moment from "moment"
import BigNumber from "bignumber.js"
import { AddLiquidityEvent, RemoveLiquidityEvent } from "@multiversx/sdk-exchange"
interface InnerDictionary {
    [key: string]: BigInt;
}

interface OuterDictionary {
    [key: string]: InnerDictionary;
}
@Injectable()
export class EventsService {
    addresses: OuterDictionary = {}
    wegld = {
        "name": "WrappedEGLD",
        "identifier": "WEGLD-bd4d79",
        "price": 28.440809330902482
    }

    htm = {
        "name": "Hatom",
        "identifier": "HTM-f51d55",
        "price": 0.7723039095181816
    }

    months = [
        "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
        "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"
    ];

    constructor(
        // private readonly cacheService: CacheService,
    ) { }

    public async eventsWebhook(eventsLog: EventLog[]): Promise<void> {
        // eventsLog.map(event => this.decodeEventESDTTransfer(event));
        let currentEvent: AddLiquidityEvent | RemoveLiquidityEvent;
        eventsLog.forEach(async (eventLog) => {
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
            // console.log(currentEvent);
            console.log(currentEvent.getTimestamp());
            const date = moment.unix(currentEvent.getTimestamp()?.toNumber() ?? 0)
            const formatedDate = date.format("DD MMMM YYYY HH:mm [UTC]")

            // const bigNum = currentEvent.getLiquidityPoolSupply();
            // console.log(moment().format(date.toDateString()))
            const htmPrice = new BigNumber(this.htm.price);
            const wegldPrice = new BigNumber(this.wegld.price);

            const htmReserve = currentEvent.getFirstTokenReserves() ?? new BigNumber(0);
            const wegldReserve = currentEvent.getSecondTokenReserves() ?? new BigNumber(0);

            const htmReservePrice = htmReserve.multipliedBy(htmPrice)
            const wegldReservePrice = wegldReserve.multipliedBy(wegldPrice);

            console.log(`${formatedDate} -> total liquidity $${(htmReservePrice.plus(wegldReservePrice)).shiftedBy(-18).toFixed()}`);
        });


    }

    // private getStructure(): StructType {
    //     return new StructType('LiquidityEvent', [
    //         new FieldDefinition('caller', '', new AddressType()),
    //         new FieldDefinition('firstTokenID', '', new TokenIdentifierType()),
    //         new FieldDefinition('firstTokenAmount', '', new BigUIntType()),
    //         new FieldDefinition('secondTokenID', '', new TokenIdentifierType()),
    //         new FieldDefinition('secondTokenAmount', '', new BigUIntType()),
    //         new FieldDefinition('lpTokenID', '', new TokenIdentifierType()),
    //         new FieldDefinition('lpTokenAmount', '', new BigUIntType()),
    //         new FieldDefinition('liquidityPoolSupply', '', new BigUIntType()),
    //         new FieldDefinition('firstTokenReserves', '', new BigUIntType()),
    //         new FieldDefinition('secondTokenReserves', '', new BigUIntType()),
    //         new FieldDefinition('block', '', new U64Type()),
    //         new FieldDefinition('epoch', '', new U64Type()),
    //         new FieldDefinition('timestamp', '', new U64Type()),
    //     ]);
}
// private decodeEvent(additionalData: string): void {
//     const data = Buffer.from(additionalData, 'base64');
//     const codec = new BinaryCodec();
//     const eventStruct = this.getStructure();
//     const [decoded] = codec.decodeNested(data, eventStruct);
//     console.log(decoded.valueOf());
//     // console.log(decoded)
//     // const htmReserve = decoded.valueOf().firstTokenReserves.valueOf() * this.htm.price;
//     // const wegldReserve = decoded.valueOf().secondTokenReserves.valueOf() * this.wegld.price;
//     // console.log(decoded.valueOf().firstTokenReserves.valueOf() * this.htm.price)
//     // console.log(decoded.valueOf().secondTokenReserves.valueOf() * this.wegld.price)
//     // console.log('wegld reserve ' + wegldReserve)
//     // console.log('htm reserve ' + htmReserve)
//     // console.log(wegldReserve + htmReserve)
//     // console.log((decoded.valueOf().liquidityPoolSupply.valueOf() as BigUIntType).toString())
//     // let date = new Date(decoded.valueOf().timestamp * 1000);
//     const date = moment.unix(decoded.valueOf().timestamp)
//     const formatedDate = date.format("DD MMMM YYYY HH:mm [UTC]")

//     // let day = date.getUTCDate();
//     // let month = date.getUTCMonth(); // Reține: luniile încep de la 0 în JavaScript
//     // let year = date.getUTCFullYear();
//     // let hours = date.getUTCHours();
//     // let minutes = date.getUTCMinutes();
//     // let value = new BigUIntType().
//     const bigNum = decoded.valueOf().liquidityPoolSupply as BigNumber;
//     // console.log(moment().format(date.toDateString()))
//     console.log(`${formatedDate} -> total liquidity $${bigNum.shiftedBy(-18).toFixed()}`);
// }
//}// moment.js
// 100. 000 000 000 000 000 000