import { Body, Controller, HttpException, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateTableBody } from "./entities";
import { DuneSimulatorService } from "@libs/services/dune-simulator";
import { CsvFile } from "./entities/csv.file";

@Controller('/dune-simulator')
@ApiTags('dune-simulator')
export class DuneSimulatorController {
    constructor(
        private readonly duneSimulatorService: DuneSimulatorService,
    ) { }

    @Post("/table/create")
    async createTable(
        @Body() body: CreateTableBody,
    ): Promise<HttpException> {
        const isTableCreated = await this.duneSimulatorService.createTable(body);
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
        const isDataInserted = await this.duneSimulatorService.insertIntoTable(tableName, body);
        if (isDataInserted) {
            return new HttpException("Data was inserted succesfully !", 201);
        } else {
            throw new HttpException("Table not found !", 404);
        }
    }
}
