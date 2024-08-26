
import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EventsLog } from "./entities/event.log";
import { EventsService } from "@libs/services/events";


@Controller()
@ApiTags('events')
export class EventsController {
    constructor(
        private readonly eventsService: EventsService,
    ) { }

    @Post("/events-webhook")
    async eventsWebhook(
        @Body() body: EventsLog,
    ): Promise<void> {
        await this.eventsService.eventsWebhook(body.events);
    }
}
