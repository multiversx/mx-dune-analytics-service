import { Injectable } from "@nestjs/common";
import { EventLog } from "apps/api/src/endpoints/events/entities/event.log";

@Injectable()
export class EventsService {
    constructor(
        // private readonly cacheService: CacheService,
    ) { }

    public async eventsWebhook(eventsLog: EventLog[]): Promise<void> {
        eventsLog.forEach(async (eventLog) => {
            console.log(eventLog);
        });
    }
}
