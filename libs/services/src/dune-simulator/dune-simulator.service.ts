import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CsvFileRepository } from "@libs/database/repositories";
import { CreateTableBody } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class DuneSimulatorService {
    private readonly logger = new OriginLogger(DuneSimulatorService.name);

    constructor(
        private readonly csvFileRepository: CsvFileRepository,

    ) { }

    async createTable(apiKey: string, contentType: string, body: CreateTableBody): Promise<any> {
        if (contentType !== 'application/json') {
            throw new HttpException("Content-Type header is not application/json", HttpStatus.BAD_REQUEST);
        }

        if (!body.namespace || !apiKey) {
            throw new HttpException(`You are not authorized to create a table under the ${body.namespace} namespace`, HttpStatus.UNAUTHORIZED);
        }

        try {
            const formattedHeaders = body.schema.map(header => header.name).join(',');
            await this.csvFileRepository.createTable(body.table_name, formattedHeaders);
        } catch (error) {
            throw error;
        }

        return {
            'namespace': body.namespace,
            'table_name': body.table_name,
            'full_name': `dune.${body.namespace}.${body.table_name}`,
            'example_query': `select * from dune.${body.namespace}.${body.table_name}`,
            'already_existed': false,
            'message': "Table created successfully",
        };
    }

    async insertIntoTable(
        nameSpace: string,
        tableName: string,
        data: any[],
        apiKey: string,
        contentType: string
    ): Promise<{ 'rows_written': number, 'bytes_written': number }> {
        if (!nameSpace || !apiKey) {
            throw new HttpException(`You are not authorized to write to the table named ${nameSpace}.${tableName}`, HttpStatus.UNAUTHORIZED);
        }
        if (contentType !== 'text/csv') {
            throw new HttpException(`{Invalid content type ${contentType}. We support CSV (Content-Type: text/csv) and newline delimited JSON (Content-Type: application/x-ndjson).`
                , HttpStatus.BAD_REQUEST);
        }

        const keys = Object.keys(data[0]);

        const stringData = data.map((item) => {
            return keys.map((key) => item[key]).join(',');
        });

        try {
            await this.csvFileRepository.insertIntoTable(tableName, stringData);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }

        const rowsWritten = stringData.length;

        const csvString = stringData.join('\n');
        const bytesWritten = Buffer.byteLength(csvString, 'utf8');

        return { 'rows_written': rowsWritten, 'bytes_written': bytesWritten };
    }

    async generateChart(tableName: string) {
        // Example data to create the chart
        const ChartJSImage = require('chartjs-to-image')
        let csvFile;
        try {
            csvFile = await this.csvFileRepository.getDocumentByTableName(tableName);
        } catch (error) {
            throw error;
        }

        const records = csvFile.records || [];
        const headers = csvFile.headers ? csvFile.headers.split(',', 2) : [];

        // Process the records
        const timestamps = [];
        const volumes: number[] = [];

        for (const record of records) {
            try {
                const [timestamp, volumeusd] = record.split(',', 2);
                const value = parseFloat(volumeusd);
                if (!isNaN(value)) {
                    if (volumes.length === 0 || volumes[volumes.length - 1] !== value) {


                        timestamps.push(timestamp.slice(0, 10));
                        volumes.push(value);
                    }
                }
            } catch (error) {
                console.error(`Skipping invalid record: ${record}`);
            }
        }

        if (timestamps.length === 0 || volumes.length === 0) {
            throw new HttpException('No valid data found for chart', HttpStatus.BAD_REQUEST);
        }

        // Generate the chart
        // const chart = await new ChartJSImage()
        //     .chart({
        //         type: 'line',
        //         data: {
        //             labels: timestamps,
        //             datasets: [{
        //                 label: tableName,
        //                 borderColor: 'rgb(75, 192, 192)',
        //                 backgroundColor: 'rgba(75, 192, 192, 0.2)',
        //                 data: volumes,
        //                 fill: true,
        //                 pointRadius: 0,
        //             }]
        //         },
        //         options: {
        //             title: {
        //                 display: true,
        //                 text: `${tableName} Area Chart`
        //             },
        //             scales: {
        //                 xAxes: [{
        //                     scaleLabel: {
        //                         display: true,
        //                         labelString: headers[0] || 'X-axis'
        //                     },
        //                     ticks: {
        //                         autoSkip: true,
        //                         maxRotation: 0, // To ensure labels are readable
        //                         minRotation: 0
        //                     }
        //                 }],
        //                 yAxes: [{
        //                     scaleLabel: {
        //                         display: true,
        //                         labelString: headers[1] || 'Y-axes'
        //                     },
        //                     ticks: {
        //                         autoSkip: true
        //                     }
        //                 }]
        //             }
        //         }
        //     })
        //     .backgroundColor('white')
        //     .width(800)
        //     .height(500)
        //     .toBuffer();
        const chart = new ChartJSImage();
        chart.setConfig({
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: tableName,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    data: volumes,
                    fill: true,
                    pointRadius: 0,
                }]
            },
            options: {
                title: {
                    display: true,
                    text: `${tableName} Area Chart`
                },
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: headers[0] || 'X-axis'
                        },
                        ticks: {
                            autoSkip: true,
                            maxRotation: 0, // To ensure labels are readable
                            minRotation: 0
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: headers[1] || 'Y-axes'
                        },
                        ticks: {
                            autoSkip: true
                        }
                    }]
                }
            }
        });
        chart.setWidth(1200).setHeight(600);

        const buff = await chart.toBinary();
        return buff;
    }
}
