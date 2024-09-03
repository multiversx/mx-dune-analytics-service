import { Injectable, Logger } from "@nestjs/common";
import { CsvFileRepository } from "@libs/database/repositories";
import { CreateTableBody } from "apps/dune-mock/src/endpoints/dune-mock/entities";
import { CsvFile } from "apps/dune-mock/src/endpoints/dune-mock/entities/csv.file";

@Injectable()
export class DuneMockService {

    constructor(
        private readonly csvFileRepository: CsvFileRepository,
    ) { }

    async createTable(body: CreateTableBody): Promise<boolean> {
        try {
            const formattedHeaders = body.schema.map(header => header.name).join(',');
            await this.csvFileRepository.createTable(body.tableName, formattedHeaders);
        } catch (error) {
            Logger.error(error);
            return false;
        }
        return true;
    }

    async insertIntoTable(csvFileName: string, body: CsvFile) {
        try {
            await this.csvFileRepository.insertIntoTable(csvFileName, body.schema);
        } catch (error) {
            Logger.error(error);
            return false;
        }
        return true;
    }

    async generateCharts() {

    }
}
