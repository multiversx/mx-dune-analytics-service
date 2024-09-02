import { CommonConfigModule, CommonConfigService } from '@libs/common';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvFile, CsvFileSchema } from './schemas/csv.file.schema';
import { CsvFileRepository } from './repositories';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [CommonConfigModule],
      useFactory: (configService: CommonConfigService) => ({
        uri: `mongodb://${configService.config.database.host}:${configService.config.database.port}`,
        dbName: configService.config.database.name,
        user: configService.config.database.username,
        pass: configService.config.database.password,
        tlsAllowInvalidCertificates: configService.config.database.tlsAllowInvalidCertificates,
      }),
      inject: [CommonConfigService],
    }),
    MongooseModule.forFeature([
      { name: CsvFile.name, schema: CsvFileSchema },
    ]),
  ],
  providers: [
    CsvFileRepository,
  ],
  exports: [
    CsvFileRepository,
  ],
})
export class DatabaseModule { }
