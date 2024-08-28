import { Injectable } from '@nestjs/common';
import { Locker } from "@multiversx/sdk-nestjs-common";
@Injectable()
export class CsvRecordsService {
    private csvRecords: Record<string, string[]> = {};

    async deleteRecord(csvFileName: string) {
        await Locker.lock(`update-record-${csvFileName}`, async () => {

            delete this.csvRecords[csvFileName];

        }, false);
    }

    async pushRecord(csvFileName: string, data: string[]) {
        await Locker.lock(`update-record-${csvFileName}`, async () => {

            if (!this.csvRecords[csvFileName]) {
                this.csvRecords[csvFileName] = data;
            } else {
                this.csvRecords[csvFileName].push(...data);
            }

        }, false);
    }

    async unshiftRecord(csvFileName: string, data: string[]) {
        await Locker.lock(`update-record-${csvFileName}`, async () => {

            if (!this.csvRecords[csvFileName]) {
                this.csvRecords[csvFileName] = data;
            } else {
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
            delete this.csvRecords[csvFileName];
        }, false);

        return record ?? [];
    }

    getKeys(): string[] {
        return Object.keys(this.csvRecords);
    }
}
