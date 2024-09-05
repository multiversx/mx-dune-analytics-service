import { Injectable } from '@nestjs/common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from '@libs/common';
import { RedlockService } from '@multiversx/sdk-nestjs-cache';

@Injectable()
export class CsvRecordsService {
    private csvRecords: Record<string, string[]> = {};
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
        const keys = await this.cachingService.getKeys("csv-records-*");
        for (const key of keys) {
            this.csvRecords[key.removePrefix("csv-records-")] = await this.cachingService.get(key) ?? [];
        }
    }

    async deleteRecord(csvFileName: string) {
        await this.redLockService.using('update-record', csvFileName, async () => {
            await this.cachingService.delete(CacheInfo.CSVRecord(csvFileName).key);
            delete this.csvRecords[csvFileName];
        }, this.keyExpiration);
    }

    async deleteFirstRecords(csvFileName: string, length: number) {
        await this.redLockService.using('update-record', csvFileName, async () => {
            this.csvRecords[csvFileName] = this.csvRecords[csvFileName].slice(length);
            await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, this.csvRecords[csvFileName], CacheInfo.CSVRecord(csvFileName).ttl);
        }, this.keyExpiration);
    }

    async pushRecord(csvFileName: string, data: string[]) {
        await this.redLockService.using('update-record', csvFileName, async () => {
            if (!this.csvRecords[csvFileName]) {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data, CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName] = data;
            } else {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, this.csvRecords[csvFileName].concat(data), CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName].push(...data);
            }
        }, this.keyExpiration);
    }

    async unshiftRecord(csvFileName: string, data: string[]) {
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

    getRecord(csvFileName: string): readonly string[] {
        return this.csvRecords[csvFileName] ?? [];
    }

    async getAndDeleteRecord(csvFileName: string): Promise<string[]> {
        const response = await this.redLockService.using('update-record', csvFileName, async () => {
            const record = this.csvRecords[csvFileName] ?? [];
            await this.cachingService.delete(CacheInfo.CSVRecord(csvFileName).key);
            delete this.csvRecords[csvFileName];

            return record;
        }, this.keyExpiration);

        return response ?? [];
    }

    getKeys(): string[] {
        return Object.keys(this.csvRecords);
    }

    async formatRecord(csvFileName: string): Promise<[string, number]> {
        let resultString: string = "timestamp,volumeusd\n";
        let length: number = 0;

        // eslint-disable-next-line require-await
        await this.redLockService.using('update-record', csvFileName, async () => {
            length = this.csvRecords[csvFileName].length;
            resultString += this.csvRecords[csvFileName].join("\n");
        }, this.keyExpiration);

        return [resultString, length];
    }
}
