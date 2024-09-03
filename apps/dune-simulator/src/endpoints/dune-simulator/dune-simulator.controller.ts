import { Body, Controller, HttpException, Param, Post, Headers } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateTableBody } from "./entities";
import { DuneSimulatorService } from "@libs/services/dune-simulator";


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

    @Post("/:name_space/:table_name/insert")
    async insertIntoTable(
        @Param('name_space') nameSpace: string,
        @Param('table_name') tableName: string,
        @Headers('x-dune-api-key') apiKey: string,
        @Headers('content-type') contentType: string,
        @Body() body: any[],
    ): Promise<{ 'rows_written': number, 'bytes_written': number }> {
        try {
            const response = await this.duneSimulatorService.insertIntoTable(nameSpace, tableName, body, apiKey, contentType);
            return response;
        } catch (error) {
            throw error;
        }
    }
}
