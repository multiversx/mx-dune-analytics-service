import { Injectable } from "@nestjs/common";
import { CsvFileRepository } from "@libs/database/repositories";
import { CreateTableBody } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { CsvFile } from "apps/dune-simulator/src/endpoints/dune-simulator/entities/csv.file";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class DuneSimulatorService {
    private readonly logger = new OriginLogger(DuneSimulatorService.name);

    constructor(
        private readonly csvFileRepository: CsvFileRepository,

    ) { }

    async createTable(body: CreateTableBody): Promise<boolean> {
        try {
            const formattedHeaders = body.schema.map(header => header.name).join(',');
            await this.csvFileRepository.createTable(body.tableName, formattedHeaders);
        } catch (error) {
            this.logger.error(error);
            return false;
        }
        return true;
    }

    async insertIntoTable(csvFileName: string, body: CsvFile) {
        try {
            await this.csvFileRepository.insertIntoTable(csvFileName, body.schema);
        } catch (error) {
            this.logger.error(error);
            return false;
        }
        return true;
    }
}
