import { Module } from "@nestjs/common";
import { ServicesModule } from "@libs/services/services.module";
import { EventsController } from "./events.controller";

@Module({
    imports: [
        ServicesModule,
    ],
    controllers: [
        EventsController,
    ],
})
export class EventsModule { }
