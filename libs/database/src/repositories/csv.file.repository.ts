import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
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
    public async createTable(csvFileName: string, headers: string): Promise<void> {
        const csvFile = await this.csvFileTableModel.findOne({ fileName: csvFileName });

        if (!csvFile) {
            await this.csvFileTableModel.create({
                fileName: csvFileName,
                headers,
                records: [],
            });
        } else {
            throw new HttpException('This table already exists', HttpStatus.CONFLICT);
        }


    }

    @ErrorLoggerAsync({ logArgs: true })
    public async insertIntoTable(csvFileName: string, newRecords: string[]): Promise<void> {
        const csvFile = await this.csvFileTableModel.findOne({ fileName: csvFileName });

        if (!csvFile) {
            throw new HttpException('This table was not found', HttpStatus.NOT_FOUND);
        }

        csvFile.records?.push(...newRecords);

        await csvFile.save();
    }
}
