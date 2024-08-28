import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Lock } from "@multiversx/sdk-nestjs-common";
import { DuneClient, ColumnType, ContentType, DuneError } from "@duneanalytics/client-sdk";
import { CsvRecordsService } from "../records";
@Injectable()
export class DuneSenderService {
    constructor(
        // private readonly cachingService: CacheService,
        private readonly csvRecordsService: CsvRecordsService,
    ) { }

    client = new DuneClient("");;

    @Cron(CronExpression.EVERY_MINUTE)
    @Lock({ name: 'send-csv-to-dune', verbose: false })
    async sendCsvRecordsToDune(): Promise<void> {
        const keys = this.csvRecordsService.getKeys();
        const records: Record<string, string[]> = {};

        for (const key of keys) {
            records[key] = await this.csvRecordsService.getAndDeleteRecord(key);
        }

        await this.sendCsvToDune(records);
    }

    async sendCsvToDune(records: Record<string, string[]>) {
        for (const [csvFileName, lines] of Object.entries(records)) {
            if (lines.length === 0) {
                continue;
            }
            let resultString = "timestamp,volumeusd\n";
            lines.forEach((line) => {
                resultString += line + "\n";
            });

            const csvData: Buffer = Buffer.from(resultString, 'utf-8');

            console.log("starting sending data from file " + csvFileName);
            const isRecordSent = await this.insertCsvDataToTable(csvFileName.toLowerCase().replace(/-/g, "_"), csvData);

            if (!isRecordSent) {
                await this.csvRecordsService.unshiftRecord(csvFileName, records[csvFileName]);
            }
        }
    }

    async createTableIfNeeded(tableName: string): Promise<boolean> {
        try {
            const result = await this.client.table.create({
                namespace: "stefanmvx",
                table_name: tableName,
                schema: [
                    { "name": "timestamp", "type": ColumnType.Varchar },
                    { "name": "volumeusd", "type": ColumnType.Double },
                ],
            });
            console.log(result);
        } catch (error) {
            Logger.error(error);
            return false;
        }

        return true;
    }

    async insertCsvDataToTable(tableName: string, data: Buffer): Promise<boolean> {
        try {
            const result = await this.client.table.insert({
                namespace: "stefanmvx",
                table_name: tableName,
                data,
                content_type: ContentType.Csv, // or ContentType.Json
            });
            console.log(result);
        } catch (error) {
            Logger.error(error);
            if (error instanceof DuneError) {
                if (error.message.includes("This table was not found")) {
                    const isTableCreated = await this.createTableIfNeeded(tableName);
                    if (isTableCreated) {
                        return await this.insertCsvDataToTable(tableName, data);
                    }
                }
            }

            return false;
        }

        return true;
    }
}
