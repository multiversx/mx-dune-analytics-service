import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ErrorLoggerAsync } from "@multiversx/sdk-nestjs-common";
import { CsvFile } from "../schemas/csv.file.schema";


@Injectable()
export class CsvFileRepository {
    constructor(
        @InjectModel(CsvFile.name) private csvFileTableModel: Model<CsvFile>,
    ) { }

    @ErrorLoggerAsync({ logArgs: true })
    public async createTable(fileName: string, headers: string): Promise<void> {
        await this.csvFileTableModel.create({
            fileName,
            headers,
            records: [],
        });
    }

    @ErrorLoggerAsync({ logArgs: true })
    public async insertIntoTable(csvFileName: string, newRecords: string[]): Promise<void> {
        const csvFile = await this.csvFileTableModel.findOne({ fileName: csvFileName });

        if (!csvFile) {
            throw new NotFoundException(`Document with name: ${csvFileName} not found`);
        }

        csvFile.records?.push(...newRecords);

        await csvFile.save();
    }
}
