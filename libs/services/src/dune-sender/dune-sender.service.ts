import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Lock, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { DuneClient, ColumnType, ContentType, DuneError } from "@duneanalytics/client-sdk";
import { CsvRecordsService } from "../records";
import { AppConfigService } from "apps/api/src/config/app-config.service";
import axios from 'axios';

@Injectable()
export class DuneSenderService {
    private readonly logger = new OriginLogger(DuneSenderService.name);

    constructor(
        private readonly csvRecordsService: CsvRecordsService,
        private readonly appConfigService: AppConfigService,
    ) { }

    client = new DuneClient(this.appConfigService.getDuneApiKey());

    @Cron(CronExpression.EVERY_10_SECONDS)
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

            const formattedCsvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
            const isRecordSent = this.appConfigService.isDuneSendingEnabled() ?
                await this.insertCsvDataToDuneTable(formattedCsvFileName, csvData) :
                await this.insertCsvDataToLocalTable(formattedCsvFileName, csvData);

            if (isRecordSent) {
                await this.csvRecordsService.deleteFirstRecords(csvFileName, linesLength);
            }
        }
    }

    async createDuneTable(tableName: string): Promise<boolean> {
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

    async createLocalTable(tableName: string): Promise<boolean> {
        const response = await axios.post(`${this.appConfigService.getDuneMockApiUrl()}/table/create`, {
            tableName,
            'schema': ['timestamp', 'volumeusd'],
        });
        console.log(response);

        return true;
    }

    async insertCsvDataToLocalTable(tableName: string, data: Buffer): Promise<boolean> {
        await axios.post(`${this.appConfigService.getDuneMockApiUrl()}/${tableName}/insert`, data, {
            headers: { 'Content-Type': ContentType.Csv },
        });

        return true;
    }

    async insertCsvDataToDuneTable(tableName: string, data: Buffer): Promise<boolean> {
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
                    const isTableCreated = await this.createDuneTable(tableName);
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
