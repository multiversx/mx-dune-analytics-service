import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateTableBody } from "apps/dune-mock/src/endpoints/dune-mock/entities";

@Injectable()
export class DuneMockService {
    constructor(
    ) { }

    async createTable(body: CreateTableBody) {
        console.log('body: ' + body);
        throw new HttpException('not implemented', HttpStatus.NOT_IMPLEMENTED);
    }

    async insertIntoTable(tableName: string, body: Buffer) {
        console.log('table_name: ' + tableName);
        for (const line of body) {
            console.log(line);
        }
        throw new HttpException('not implemented', HttpStatus.NOT_IMPLEMENTED);
        // throw new HttpException('Table not found', HttpStatus.NOT_FOUND);
    }
}
