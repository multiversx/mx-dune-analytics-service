import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities";
import { liquidationBorrowEvent } from "./hex-constants";

@Injectable()
export class HatomLiquidationService {
    constructor() { }

    public async hatomLiquidationWebhook(eventsLog: EventLog[]): Promise<void> {
        for (const eventLog of eventsLog) {
            if (eventLog.identifier === "liquidateBorrow" && eventLog.topics[0] === liquidationBorrowEvent) {
                
            }
        }
    }
}