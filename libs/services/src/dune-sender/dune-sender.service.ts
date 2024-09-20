import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Lock, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CsvRecordsService } from "../records";
import { AppConfigService } from "apps/events-processor/src/config/app-config.service";
import axios from 'axios';
import { TableSchema } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { toSnakeCase } from "libs/services/utils";

@Injectable()
export class DuneSenderService {
    private readonly logger = new OriginLogger(DuneSenderService.name);

    constructor(
        private readonly csvRecordsService: CsvRecordsService,
        private readonly appConfigService: AppConfigService,
    ) { }

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

            const formattedCsvFileName = toSnakeCase(csvFileName);

            const isRecordSent = await this.insertCsvDataToTable(formattedCsvFileName, csvData);

            if (isRecordSent) {
                await this.csvRecordsService.deleteFirstRecords(csvFileName, linesLength);
            }
        }
    }

    async createTable(tableName: string): Promise<boolean> {
        try {
            const schema: TableSchema[] = this.csvRecordsService.getHeaders(tableName);

            const url = `${this.appConfigService.getDuneApiUrl()}/create`;
            const payload = {
                'namespace': this.appConfigService.getDuneNamespace(),
                'table_name': tableName,
                'description': 'test',
                'schema': schema,
                "is_private": false,
            };

            const response = await axios.post(url, JSON.stringify(payload), {
                headers: {
                    'content-type': 'application/json',
                    'x-dune-api-key': this.appConfigService.getDuneApiKey(),
                },
            });
            this.logger.log(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                this.logger.log(error.response.data);
                return false;
            }

        }
        return true;
    }

    async insertCsvDataToTable(tableName: string, data: Buffer): Promise<boolean> {

        try {
            const url = `${this.appConfigService.getDuneApiUrl()}/${this.appConfigService.getDuneNamespace()}/${tableName}/insert`;
            const response = await axios.post(url, data, {
                headers: {
                    'content-type': 'text/csv',
                    'x-dune-api-key': this.appConfigService.getDuneApiKey(),
                },
            });
            this.logger.log(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                this.logger.log(error.response.data);
                if (error.response.status === 404) {
                    this.logger.log("Trying to create local table !");
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
