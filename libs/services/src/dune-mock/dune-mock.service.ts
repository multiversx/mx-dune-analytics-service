import { Injectable } from "@nestjs/common";
import { CreateTableBody } from "apps/dune-mock/src/endpoints/dune-mock/entities";
import { CsvFile } from "apps/dune-mock/src/endpoints/dune-mock/entities/csv.file";

@Injectable()
export class DuneMockService {
    constructor(
    ) { }

    async createTable(body: CreateTableBody) {
        console.log('body: ' + body);
    }

    async insertIntoTable(tableName: string, body: CsvFile) {
        console.log('table_name: ' + tableName);
        console.log(body);
    }
}
