import { DuneMockService } from "@libs/services/dune-mock";
import { Body, Controller, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateTableBody } from "./entities";

@Controller('/dune-mock')
@ApiTags('dune-mock')
export class DuneMockController {
    constructor(
        private readonly duneMockService: DuneMockService,
    ) { }

    @Post("/table/create")
    async createTable(
        @Body() body: CreateTableBody,
    ): Promise<void> {
        await this.duneMockService.createTable(body);
    }

    @Post("/:table_name/insert")
    async insertIntoTable(
        @Param('table_name') tableName: string,
        @Body() body: Buffer,
    ): Promise<void> {
        console.log("HEEEEEEEEEEEEEEEEEEEEERRRRRRRRRREEEEEEEEEEEEEEEEEEEEEEEEEE")
        await this.duneMockService.insertIntoTable(tableName, body);
    }
}
