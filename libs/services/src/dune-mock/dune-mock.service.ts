import { Injectable } from "@nestjs/common";
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
            await this.csvFileRepository.createTable(body.tableName, "timestamp,volumeusd");
        } catch (error) {
            console.log(error);
            return false;
        }
        return true;
    }

    async insertIntoTable(csvFileName: string, body: CsvFile) {
        try {
            await this.csvFileRepository.insertIntoTable(csvFileName, body.schema);
        } catch (error) {
            return false;
        }
        return true;
    }

    async generateCharts() {

    }
}
