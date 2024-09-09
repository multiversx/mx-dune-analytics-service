import { Injectable } from '@nestjs/common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from '@libs/common';
import { RedlockService } from '@multiversx/sdk-nestjs-cache';

@Injectable()
export class CsvRecordsService {
    private csvRecords: Record<string, string[]> = {};
    private csvHeaders: Record<string, string[]> = {}
    private readonly keyExpiration = 10000;

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
        csvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
        await this.redLockService.using('update-record', csvFileName, async () => {
            await this.cachingService.delete(CacheInfo.CSVRecord(csvFileName).key);
            await this.cachingService.delete(`${CacheInfo.CSVHeaders(csvFileName).key}`)
            delete this.csvRecords[csvFileName];
            delete this.csvHeaders[csvFileName];
        }, this.keyExpiration);
    }

    async deleteFirstRecords(csvFileName: string, length: number) {
        csvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
        await this.redLockService.using('update-record', csvFileName, async () => {
            this.csvRecords[csvFileName] = this.csvRecords[csvFileName].slice(length);
            await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, this.csvRecords[csvFileName], CacheInfo.CSVHeaders(csvFileName).ttl);
        }, this.keyExpiration);
    }

    async pushRecord(csvFileName: string, data: string[], headers: string[]) {
        csvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
        await this.redLockService.using('update-record', csvFileName, async () => {
            if (!this.csvRecords[csvFileName]) {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data, CacheInfo.CSVRecord(csvFileName).ttl);
                await this.cachingService.set(CacheInfo.CSVHeaders(csvFileName).key, headers, CacheInfo.CSVHeaders(csvFileName).ttl);
                this.csvRecords[csvFileName] = data;
                this.csvHeaders[csvFileName] = headers;
                console.log("PUSHHHHHHHHHHHHHHHHHHH " + this.csvHeaders[csvFileName] + "       " + csvFileName);

            } else {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, this.csvRecords[csvFileName].concat(data), CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName].push(...data);
            }
        }, this.keyExpiration);
    }

    async unshiftRecord(csvFileName: string, data: string[]) {
        csvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
        await this.redLockService.using('update-record', csvFileName, async () => {
            if (!this.csvRecords[csvFileName]) {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data, CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName] = data;
            } else {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data.concat(this.csvRecords[csvFileName]), CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName].unshift(...data);
            }
        }, this.keyExpiration);

    }

    getRecords(): Record<string, string[]> {
        return this.csvRecords ?? {};
    }

    async getRecord(csvFileName: string): Promise<readonly string[]> {
        csvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
        return await this.redLockService.using('update-record', csvFileName, async () => {
            return this.csvRecords[csvFileName] ?? [];
        }, this.keyExpiration);
    }

    async getHeaders(csvFileName: string): Promise<readonly string[]> {
        csvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
        console.log(this.csvHeaders[csvFileName]);
        return await this.redLockService.using('update-record', csvFileName, async () => {
            return this.csvHeaders[csvFileName] ?? [];
        }, this.keyExpiration);
    }

    async getAndDeleteRecord(csvFileName: string): Promise<string[]> {
        csvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
        const response = await this.redLockService.using('update-record', csvFileName, async () => {
            const record = this.csvRecords[csvFileName] ?? [];
            await this.cachingService.delete(CacheInfo.CSVRecord(csvFileName).key);
            await this.cachingService.delete(CacheInfo.CSVHeaders(csvFileName).key);
            delete this.csvRecords[csvFileName];
            delete this.csvHeaders[csvFileName];

            return record;
        }, this.keyExpiration);

        return response ?? [];
    }

    getKeys(): string[] {
        return Object.keys(this.csvRecords);
    }

    async formatRecord(csvFileName: string): Promise<[string, number]> {
        csvFileName = csvFileName.toLowerCase().replace(/-/g, "_");
        let resultString: string = `${this.csvHeaders[csvFileName][0]},${this.csvHeaders[csvFileName][1]}\n`;

        let length: number = 0;

        // eslint-disable-next-line require-await
        await this.redLockService.using('update-record', csvFileName, async () => {
            length = this.csvRecords[csvFileName].length;
            resultString += this.csvRecords[csvFileName].join("\n");
        }, this.keyExpiration);

        return [resultString, length];
    }
}
