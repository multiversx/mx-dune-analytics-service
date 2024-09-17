import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EventLog } from "./entities/event.log";
import { HatomBorrowEventsService, HatomLiquidationService, LiquidityEventsService } from "@libs/services/events";

@Controller('/events')
@ApiTags('events')
export class EventsController {
    constructor(
        private readonly liquidityService: LiquidityEventsService,
        private readonly hatomBorrowService: HatomBorrowEventsService,
        private readonly hatomLiquidationService: HatomLiquidationService,
    ) { }

    @Post("/liquidity-webhook")
    async liquidityWebhook(
        @Body() body: EventLog[],
    ): Promise<void> {
        await this.liquidityService.liquidityWebhook(body);
    }

    @Post("/hatom-borrow-webhook/:borrowed_token")
    async hatomBorrowWebhook(
        @Body() body: EventLog[],
        @Param('borrowed_token') borrowedToken: string,
    ): Promise<void> {
        await this.hatomBorrowService.hatomBorrowWebhook(body, borrowedToken);
    }

    @Post("/hatom-liquidation-webhook/:borrowed_token")
    async hatomLiquidationWebhook(
        @Body() body: EventLog[],
    ): Promise<void> {
        await this.hatomLiquidationService.hatomLiquidationWebhook(body);
    }

}
