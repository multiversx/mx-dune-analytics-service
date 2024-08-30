import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EventLog, EventsLog } from "./entities/event.log";
import { EventsService } from "@libs/services/events";
import { DuneSenderService } from "@libs/services/dune-sender";

@Controller()
@ApiTags('events')
export class EventsController {
    constructor(
        private readonly eventsService: EventsService,
        private readonly duneSenderService: DuneSenderService,
    ) { }

    @Post("/events-webhook")
    async eventsWebhook(
        @Body() body: EventLog[],
    ): Promise<void> {
        await this.eventsService.eventsWebhook(body);
    }

    @Get("/test")
    async test(
    ): Promise<void> {
        return await this.duneSenderService.sendCsvRecordsToDune();
    }
}
