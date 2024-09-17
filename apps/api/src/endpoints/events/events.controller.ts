import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EventLog } from "./entities/event.log";
import { HatomBorrowEventsService, LiquidityEventsService } from "@libs/services/events";

@Controller('/events')
@ApiTags('events')
export class EventsController {
    constructor(
        private readonly liquidityService: LiquidityEventsService,
        private readonly hatomBorrowService: HatomBorrowEventsService,
    ) { }

    @Post("/liquidity-webhook")
    async liquidityWebhook(
        @Body() body: EventLog[],
    ): Promise<void> {
        await this.liquidityService.liquidityWebhook(body);
    }

    @Post("/hatom-webhook/:borrowed_token")
    async hatomBorrowWebhook(
        @Body() body: EventLog[],
        @Param('borrowed_token') borrowedToken: string,
    ): Promise<void> {
        await this.hatomBorrowService.hatomBorrowWebhook(body, borrowedToken);
    }

}
