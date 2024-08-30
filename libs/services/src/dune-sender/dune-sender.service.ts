import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Lock, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { DuneClient, ColumnType, ContentType, DuneError } from "@duneanalytics/client-sdk";
import { CsvRecordsService } from "../records";
import { AppConfigService } from "apps/api/src/config/app-config.service";

@Injectable()
export class DuneSenderService {
    private readonly logger = new OriginLogger(DuneSenderService.name);

    constructor(
        private readonly csvRecordsService: CsvRecordsService,
        private readonly appConfigService: AppConfigService,
    ) { }

    client = new DuneClient(this.appConfigService.getDuneApiKey());

    @Cron(CronExpression.EVERY_5_MINUTES)
    @Lock({ name: 'send-csv-to-dune', verbose: false })
    async sendCsvRecordsToDune(): Promise<void> {
        const records: Record<string, string[]> = this.csvRecordsService.getRecords();

        await this.sendCsvToDune(records);
    }

    async sendCsvToDune(records: Record<string, string[]>) {
        for (const [csvFileName, lines] of Object.entries(records)) {
            if (lines.length === 0) {
                continue;
            }
            const [resultString, linesLength] = await this.csvRecordsService.formatRecord(csvFileName);

            const csvData: Buffer = Buffer.from(resultString, 'utf-8');

            this.logger.log("starting sending data from file " + csvFileName);
            const isRecordSent = await this.insertCsvDataToTable(csvFileName.toLowerCase().replace(/-/g, "_"), csvData);

            if (isRecordSent) {
                await this.csvRecordsService.deleteFirstRecords(csvFileName, linesLength);
            }
        }
    }

    async createTable(tableName: string): Promise<boolean> {
        try {
            const response = await this.client.table.create({
                namespace: this.appConfigService.getDuneNamespace(),
                table_name: tableName,
                schema: [
                    { "name": "timestamp", "type": ColumnType.Varchar },
                    { "name": "volumeusd", "type": ColumnType.Double },
                ],
            });
            this.logger.log(response);
        } catch (error) {
            Logger.error(error);
            return false;
        }
        return true;
    }

    async insertCsvDataToTable(tableName: string, data: Buffer): Promise<boolean> {
        try {
            const result = await this.client.table.insert({
                namespace: this.appConfigService.getDuneNamespace(),
                table_name: tableName,
                data,
                content_type: ContentType.Csv,
            });
            this.logger.log(result);

        } catch (error) {
            Logger.error(error);
            if (error instanceof DuneError) {
                if (error.message.includes("This table was not found")) {
                    const isTableCreated = await this.createTable(tableName);
                    if (isTableCreated) {
                        this.logger.log("Table was created");
                    }
                }
            }
            return false;
        }
        return true;
    }
}
