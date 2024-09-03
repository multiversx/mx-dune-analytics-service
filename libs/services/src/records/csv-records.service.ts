import { Injectable } from '@nestjs/common';
import { Locker } from "@multiversx/sdk-nestjs-common";
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from '@libs/common';

@Injectable()
export class CsvRecordsService {
    private csvRecords: Record<string, string[]> = {};

    constructor(
        private readonly cachingService: CacheService,
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
        await Locker.lock(`update-record-${csvFileName}`, async () => {
            await this.cachingService.delete(CacheInfo.CSVRecord(csvFileName).key);
            delete this.csvRecords[csvFileName];
        }, false);
    }

    async deleteFirstRecords(csvFileName: string, length: number) {
        await Locker.lock(`update-record-${csvFileName}`, async () => {
            this.csvRecords[csvFileName] = this.csvRecords[csvFileName].slice(length);
            await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, this.csvRecords[csvFileName], CacheInfo.CSVRecord(csvFileName).ttl);
        }, false);
    }

    async pushRecord(csvFileName: string, data: string[]) {
        await Locker.lock(`update-record-${csvFileName}`, async () => {
            if (!this.csvRecords[csvFileName]) {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data, CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName] = data;
            } else {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, this.csvRecords[csvFileName].concat(data), CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName].push(...data);
            }
        }, false);
    }

    async unshiftRecord(csvFileName: string, data: string[]) {
        await Locker.lock(`update-record-${csvFileName}`, async () => {
            if (!this.csvRecords[csvFileName]) {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data, CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName] = data;
            } else {
                await this.cachingService.set(CacheInfo.CSVRecord(csvFileName).key, data.concat(this.csvRecords[csvFileName]), CacheInfo.CSVRecord(csvFileName).ttl);
                this.csvRecords[csvFileName].unshift(...data);
            }
        }, false);
    }

    getRecords(): Record<string, string[]> {
        return this.csvRecords ?? {};
    }

    getRecord(csvFileName: string): readonly string[] {
        return this.csvRecords[csvFileName] ?? [];
    }

    async getAndDeleteRecord(csvFileName: string): Promise<string[]> {
        let record;

        await Locker.lock(`update-record-${csvFileName}`, async () => {
            record = this.csvRecords[csvFileName] ?? [];
            await this.cachingService.delete(CacheInfo.CSVRecord(csvFileName).key);
            delete this.csvRecords[csvFileName];
        }, false);

        return record ?? [];
    }

    getKeys(): string[] {
        return Object.keys(this.csvRecords);
    }

    async formatRecord(csvFileName: string): Promise<[string, number]> {
        let resultString: string = "timestamp,volumeusd\n";
        let length: number = 0;

        // eslint-disable-next-line require-await
        await Locker.lock(`update-record-${csvFileName}`, async () => {
            length = this.csvRecords[csvFileName].length;
            resultString += this.csvRecords[csvFileName].join("\n");
        }, false);

        return [resultString, length];
    }
}
