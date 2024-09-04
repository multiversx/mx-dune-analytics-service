import { Body, Controller, Param, Post, Headers } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateTableBody } from "./entities";
import { DuneSimulatorService } from "@libs/services/dune-simulator";

@Controller('/api/v1/table')
@ApiTags('dune-simulator')
export class DuneSimulatorController {
    constructor(
        private readonly duneSimulatorService: DuneSimulatorService,
    ) { }

    @Post("/table/create")
    async createTable(
        @Headers('x-dune-api-key') apiKey: string,
        @Headers('content-type') contentType: string,
        @Body() body: CreateTableBody,
    ): Promise<any> {
        try {
            const response = await this.duneSimulatorService.createTable(apiKey, contentType, body);
            return response;
        } catch (error) {
            throw error;
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
