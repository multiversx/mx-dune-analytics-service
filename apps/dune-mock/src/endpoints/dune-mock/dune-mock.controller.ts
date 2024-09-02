import { Body, Controller, Get, HttpException, Param, Post } from "@nestjs/common";
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
    ): Promise<HttpException> {
        const isTableCreated = await this.duneMockService.createTable(body);
        if (isTableCreated) {
            return new HttpException("Table was created sucessfully !", 201);
        } else {
            throw new HttpException("Table was not created !", 400);
        }
    }

    @Post("/:table_name/insert")
    async insertIntoTable(
        @Param('table_name') tableName: string,
        @Body() body: CsvFile,
    ): Promise<HttpException> {
        // console.log("HEEEEEEEEEEEEEEEEEEEEERRRRRRRRRREEEEEEEEEEEEEEEEEEEEEEEEEE");
        // console.log(body);
        const isDataInserted = await this.duneMockService.insertIntoTable(tableName, body);
        if (isDataInserted) {
            return new HttpException("Data was inserted succesfully !", 201);
        } else {
            throw new HttpException("Table not found !", 404);
        }
    }

    @Get("/generate-charts")
    async generateCharts() {
        await this.duneMockService.generateCharts();
    }
}
