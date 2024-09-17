import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EventLog } from "./entities/event.log";
import { HatomBorrowEventsService, HatomEnterMarketEventsService, LiquidityEventsService } from "@libs/services/events";

@Controller('/events')
@ApiTags('events')
export class EventsController {
    constructor(
        private readonly liquidityService: LiquidityEventsService,
        private readonly hatomBorrowService: HatomBorrowEventsService,
        private readonly hatomEnterMarketService: HatomEnterMarketEventsService,
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

    @Post("/hatom-enter-market-webhook")
    async hatomEnterMarketWebhook(
        @Body() body: EventLog[],
    ): Promise<void> {
        await this.hatomEnterMarketService.hatomEnterMarketWebhook(body);
    }
}
