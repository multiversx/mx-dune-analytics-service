import { Injectable } from '@nestjs/common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from '@libs/common';
import { RedlockService } from '@multiversx/sdk-nestjs-cache';
import { TableSchema } from 'apps/dune-simulator/src/endpoints/dune-simulator/entities';
import { toSnakeCase } from 'libs/services/utils';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/string.extensions';
@Injectable()
export class CsvRecordsService {
    private csvRecords: Record<string, string[]> = {};
    private csvHeaders: Record<string, TableSchema[]> = {};
    private readonly keyExpiration = 60000;
    private readonly maxRetries = 100;
    private readonly retryInterval = 5000;

    constructor(
        private readonly cachingService: CacheService,
        private readonly redLockService: RedlockService,
    ) {
        this.init().catch(error => {
            console.error('Failed to initialize:', error);
        });
    }

    private async init() {
        const recordsKeys = await this.cachingService.getKeys("csv-records-*");
        for (const key of recordsKeys) {
            this.csvRecords[key.removePrefix("csv-records-")] = await this.cachingService.get(key) ?? [];
        }

        const headersKeys = await this.cachingService.getKeys("csv-headers-*");
        for (const key of headersKeys) {
            this.csvHeaders[key.removePrefix("csv-headers-")] = await this.cachingService.get(key) ?? [];
        }
    }

    async deleteRecord(csvFileName: string) {
        csvFileName = toSnakeCase(csvFileName);
        await this.redLockService.using('update-record', csvFileName, async () => {
            await this.cachingService.delete(CacheInfo.CSVRecord(csvFileName).key);
            await this.cachingService.delete(`${CacheInfo.CSVHeaders(csvFileName).key}`);
            delete this.csvRecords[csvFileName];
            delete this.csvHeaders[csvFileName];
        }, { keyExpiration: this.keyExpiration, maxRetries: this.maxRetries, retryInterval: this.retryInterval });
    }

    async deleteFirstRecords(csvFileName: string, length: number) {
        csvFileName = toSnakeCase(csvFileName);
        await this.redLockService.using('update-record', csvFileName, async () => {
            this.csvRecords[csvFileName] = this.csvRecords[csvFileName].slice(length);
            await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, this.csvRecords[csvFileName], CacheInfo.CSVHeaders(csvFileName).ttl);
        }, { keyExpiration: this.keyExpiration, maxRetries: this.maxRetries, retryInterval: this.retryInterval });
    }

    async pushRecords(csvFileName: string, data: string[], headers: TableSchema[]) {
        csvFileName = toSnakeCase(csvFileName);
        await this.redLockService.using('update-record', csvFileName, async () => {
            if (!this.csvRecords[csvFileName]) {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data, CacheInfo.CSVRecord(csvFileName).ttl);
                await this.cachingService.set(CacheInfo.CSVHeaders(csvFileName).key, headers, CacheInfo.CSVHeaders(csvFileName).ttl);
                this.csvRecords[csvFileName] = data;
                this.csvHeaders[csvFileName] = headers.map(header => ({
                    ...header,
                    name: toSnakeCase(header.name),
                }));
            } else {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, this.csvRecords[csvFileName].concat(data), CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName].push(...data);
            }
        }, { keyExpiration: this.keyExpiration, maxRetries: this.maxRetries, retryInterval: this.retryInterval });
    }

    async unshiftRecord(csvFileName: string, data: string[]) {
        csvFileName = toSnakeCase(csvFileName);
        await this.redLockService.using('update-record', csvFileName, async () => {
            if (!this.csvRecords[csvFileName]) {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data, CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName] = data;
            } else {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data.concat(this.csvRecords[csvFileName]), CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName].unshift(...data);
            }
        }, { keyExpiration: this.keyExpiration, maxRetries: this.maxRetries, retryInterval: this.retryInterval });

    }

    getRecords(): Record<string, string[]> {
        return this.csvRecords ?? {};
    }

    getRecord(csvFileName: string): readonly string[] {
        csvFileName = toSnakeCase(csvFileName);
        return this.csvRecords[csvFileName] ?? [];
    }

    getHeaders(csvFileName: string): TableSchema[] {
        csvFileName = toSnakeCase(csvFileName);
        return this.csvHeaders[csvFileName] ?? [];
    }

    async getAndDeleteRecord(csvFileName: string): Promise<string[]> {
        csvFileName = toSnakeCase(csvFileName);
        const response = await this.redLockService.using('update-record', csvFileName, async () => {
            const record = this.csvRecords[csvFileName] ?? [];
            await this.cachingService.delete(CacheInfo.CSVRecord(csvFileName).key);
            await this.cachingService.delete(CacheInfo.CSVHeaders(csvFileName).key);
            delete this.csvRecords[csvFileName];
            delete this.csvHeaders[csvFileName];

            return record;
        }, { keyExpiration: this.keyExpiration, maxRetries: this.maxRetries, retryInterval: this.retryInterval });

        return response ?? [];
    }

    getKeys(): string[] {
        return Object.keys(this.csvRecords);
    }

    async formatRecord(csvFileName: string): Promise<[string, number]> {
        csvFileName = toSnakeCase(csvFileName);
        let resultString: string = `${this.csvHeaders[csvFileName].map((header) => header.name).join(',')}\n`;

        let length: number = 0;

        // eslint-disable-next-line require-await
        await this.redLockService.using('update-record', csvFileName, async () => {
            length = this.csvRecords[csvFileName].length;
            resultString += this.csvRecords[csvFileName].join("\n");
        }, { keyExpiration: this.keyExpiration, maxRetries: this.maxRetries, retryInterval: this.retryInterval });

        return [resultString, length];
    }
}
