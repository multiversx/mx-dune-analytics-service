import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Schema } from "mongoose";
import { ErrorLoggerAsync } from "@multiversx/sdk-nestjs-common";
import { TableSchema } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";

@Injectable()
export class DynamicCollectionRepository {
    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) { }

    @ErrorLoggerAsync({ logArgs: true })
    public async createTable(collectionName: string, fields: TableSchema[]): Promise<void> {
        const existingCollections = await this.connection.db.listCollections({ name: collectionName }).toArray();

        if (existingCollections.length > 0) {
            throw new HttpException('This table already exists', HttpStatus.CONFLICT);
        }

        const schemaDefinition: Record<string, any> = {};
        for (const schema of fields) {
            schemaDefinition[schema.name] = { type: this.mapToMongooseType(schema.type), required: true };
        }

        const dynamicSchema = new Schema(schemaDefinition);
        this.connection.model(collectionName, dynamicSchema);
    }

    @ErrorLoggerAsync({ logArgs: true })
    public async insertIntoTable(collectionName: string, newRecords: Record<string, any>[]): Promise<void> {
        const existingCollections = await this.connection.db.listCollections({ name: collectionName }).toArray();
        if (existingCollections.length === 0) {
            throw new HttpException('This table was not found', HttpStatus.NOT_FOUND);
        }
        const dynamicModel = this.connection.db.collection(collectionName);

        await dynamicModel.insertMany(newRecords);
    }

    @ErrorLoggerAsync({ logArgs: true })
    public async getCollectionDocuments(collectionName: string): Promise<any> {
        const existingCollections = await this.connection.db.listCollections({ name: collectionName }).toArray();
        if (existingCollections.length === 0) {
            throw new HttpException('This collection was not found', HttpStatus.NOT_FOUND);
        }

        const dynamicModel = this.connection.db.collection(collectionName);

        const collectionDocuments = await dynamicModel.find().sort({ ['timestamp']: 1 }).toArray();

        if (collectionDocuments.length === 0) {
            throw new HttpException('No documents found in this collection', HttpStatus.NOT_FOUND);
        }

        return collectionDocuments;
    }

    private mapToMongooseType(fieldType: string) {
        switch (fieldType.toLowerCase()) {
            case 'varchar':
                return String;
            case 'double':
                return Number;
            default:
                throw new HttpException(`Unsupported field type: ${fieldType}`, HttpStatus.BAD_REQUEST);
        }
    }

    public async setLastProcessedTimestamp(nonce: number) {
        const collectionName = `last_processed_nonce`;
        const existingCollections = await this.connection.db.listCollections({ name: collectionName }).toArray();
        if (existingCollections.length === 0) {
            const schema = new Schema({
                shardId: { type: Number, required: true },
                nonce: { type: Number, required: true },
            });
            this.connection.model(collectionName, schema);
        }
        const dynamicModel = this.connection.db.collection(collectionName);
        await dynamicModel.updateOne({ $set: { nonce } }, { upsert: true });
    }

    public async getLastProcessedTimestamp() {
        const collectionName = `last_processed_nonce`;
        const existingCollections = await this.connection.db.listCollections({ name: collectionName }).toArray();
        if (existingCollections.length === 0) {
            return 0;
        }
        const dynamicModel = this.connection.db.collection(collectionName);
        const lastProcessedNonce = await dynamicModel.findOne();
        if (!lastProcessedNonce) {
            return 0;
        }
        return lastProcessedNonce.nonce;
    }
}

