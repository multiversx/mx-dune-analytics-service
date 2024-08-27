import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EventsService } from "../events";

@Injectable()
export class DuneSenderService {
    constructor(
        // private readonly cachingService: CacheService,
        private readonly eventsService: EventsService,
    ) { }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async sendCsvRecordsToDune() {
        const records = this.eventsService.csvRecords;
        console.log("da")
        console.log(records);
    }

}
