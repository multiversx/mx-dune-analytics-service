import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CsvFileRepository } from "@libs/database/repositories";
import { CreateTableBody } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
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

    async insertIntoTable(
        nameSpace: string,
        tableName: string,
        data: any[],
        apiKey: string,
        contentType: string
    ): Promise<{ 'rows_written': number, 'bytes_written': number }> {
        if (!nameSpace || !apiKey) {
            throw new HttpException(`You are not authorized to write to the table named ${nameSpace}.${tableName}`, HttpStatus.UNAUTHORIZED);
        }
        if (contentType !== 'text/csv') {
            throw new HttpException(`{Invalid content type ${contentType}. We support CSV (Content-Type: text/csv) and newline delimited JSON (Content-Type: application/x-ndjson).`
                , HttpStatus.BAD_REQUEST);
        }

        const keys = Object.keys(data[0]);

        const stringData = data.map((item) => {
            return keys.map((key) => item[key]).join(',');
        });

        try {
            await this.csvFileRepository.insertIntoTable(tableName, stringData);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }

        const rowsWritten = stringData.length;

        const csvString = stringData.join('\n');
        const bytesWritten = Buffer.byteLength(csvString, 'utf8');

        return { 'rows_written': rowsWritten, 'bytes_written': bytesWritten };
    }
}
