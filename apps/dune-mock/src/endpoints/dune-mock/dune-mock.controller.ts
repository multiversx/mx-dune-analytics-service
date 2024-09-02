import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateTableBody } from "./entities";
import { DuneMockService } from "@libs/services/dune-mock";
import { CsvFile } from "./entities/csv.file";

@Controller('/dune-mock')
@ApiTags('dune-mock')
export class DuneMockController {
    constructor(
        private readonly duneMockService: DuneMockService,
    ) { }

    @Get('/test')
    async test() {
        return "da";
    }
    @Post("/table/create")
    async createTable(
        @Body() body: CreateTableBody,
    ): Promise<void> {
        await this.duneMockService.createTable(body);
    }

    @Post("/:table_name/insert")
    async insertIntoTable(
        @Param('table_name') tableName: string,
        @Body() body: CsvFile,
    ): Promise<void> {
        // console.log("HEEEEEEEEEEEEEEEEEEEEERRRRRRRRRREEEEEEEEEEEEEEEEEEEEEEEEEE");
        // console.log(body);
        await this.duneMockService.insertIntoTable(tableName, body);
    }
}
