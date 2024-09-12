import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EventLog } from "./entities/event.log";
import { HatomEventsService, LiquidityEventsService } from "@libs/services/events";

@Controller('/events')
@ApiTags('events')
export class EventsController {
    constructor(
        private readonly liquidityService: LiquidityEventsService,
        private readonly hatomService: HatomEventsService,
    ) { }

    @Post("/liquidity-webhook")
    async liquidityWebhook(
        @Body() body: EventLog[],
    ): Promise<void> {
        await this.liquidityService.liquidityWebhook(body);
    }

    @Post("/hatom-webhook")
    async hatomWebhook(
        @Body() body: EventLog[],
    ): Promise<void> {
        console.log(body);
        await this.hatomService.hatomWebhook(body);
    }

}
