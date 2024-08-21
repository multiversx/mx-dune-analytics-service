import { AddressUtils } from "@multiversx/sdk-nestjs-common";
import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities/event.log";

interface InnerDictionary {
    [key: string]: BigInt;
}

interface OuterDictionary {
    [key: string]: InnerDictionary;
}
@Injectable()
export class EventsService {
    addresses: OuterDictionary = {}
    private decodeEventESDTTransfer(eventLog: EventLog) {
        eventLog.topics[0] = Buffer.from(eventLog.topics[0], 'base64').toString();
        eventLog.topics[2] = parseInt(Buffer.from(eventLog.topics[2], 'base64').toString('hex'), 16).toString();
        eventLog.topics[3] = AddressUtils.bech32Encode(Buffer.from(eventLog.topics[3], 'base64').toString('hex'));
    }

    constructor(
        // private readonly cacheService: CacheService,
    ) { }

    public async eventsWebhook(eventsLog: EventLog[]): Promise<void> {
        eventsLog.map(event => this.decodeEventESDTTransfer(event));
        eventsLog.forEach(async (eventLog) => {

            if (eventLog.identifier !== "ESDTTransfer") {
                return;
            }

            // this.decodeEventESDTTransfer(eventLog);
            console.log(eventLog);
            // addresses[eventLog.address] = {
            //     eventLog.identifier: eventLog.topics[2]
            // };
            const receiver = eventLog.topics[3];
            const sender = eventLog.address;
            const identifier = eventLog.topics[0];
            const value = eventLog.topics[2];

            if (sender === eventsLog[0].address && receiver === eventsLog[0].topics[1])

                if (!this.addresses[sender]) {
                    this.addresses[sender] = {};
                }
            if (!this.addresses[receiver]) {
                this.addresses[receiver] = {};
            }
            if (!this.addresses[sender][identifier]) {
                this.addresses[sender][identifier] = BigInt(0);
            }
            if (!this.addresses[receiver][identifier]) {
                this.addresses[receiver][identifier] = BigInt(0);
            }
            let senderAmount = this.addresses[sender][identifier];
            let receiverAmount = this.addresses[receiver][identifier];
            this.addresses[sender][identifier] = senderAmount.valueOf() - BigInt(value).valueOf();
            this.addresses[receiver][identifier] = receiverAmount.valueOf() + BigInt(value).valueOf();

        });

        console.log(this.addresses);

    }
}
