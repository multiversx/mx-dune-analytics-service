import { Injectable } from "@nestjs/common";
import { CreateTableBody } from "apps/dune-mock/src/endpoints/dune-mock/entities";

@Injectable()
export class DuneMockService {
    constructor(
    ) { }

    async createTable(body: CreateTableBody) {
        console.log('body: ' + body);
    }

    async insertIntoTable(tableName: string, body: Buffer) {
        console.log('table_name: ' + tableName);
        console.log('body: ' + body.toString())
    }
}
