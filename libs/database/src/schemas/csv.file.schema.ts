import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from 'mongoose';

export type CsvFileDocument = HydratedDocument<CsvFile>;


@Schema({ collection: 'csv_files', timestamps: true })
export class CsvFile {
    @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
    _id!: string;

    @Prop({ required: true, type: String })
    fileName!: string;

    @Prop({ required: true, type: String })
    headers!: string;


    @Prop({ required: true, type: [String], default: [] })
    records!: string[];
}

export const CsvFileSchema = SchemaFactory.createForClass(CsvFile);
