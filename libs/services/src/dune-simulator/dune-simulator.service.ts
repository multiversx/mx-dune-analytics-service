import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateTableBody } from "apps/dune-simulator/src/endpoints/dune-simulator/entities";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import ChartJSImage from 'chartjs-to-image';
import path from "path";
import fs from "fs";
import { DynamicCollectionRepository } from "@libs/database/collections";
@Injectable()
export class DuneSimulatorService {
    private readonly logger = new OriginLogger(DuneSimulatorService.name);

    constructor(
        private readonly dynamicCollectionRepository: DynamicCollectionRepository,
    ) { }

    async createTable(apiKey: string, contentType: string, body: CreateTableBody): Promise<any> {
        if (contentType !== 'application/json') {
            throw new HttpException("Content-Type header is not application/json", HttpStatus.BAD_REQUEST);
        }

        if (!body.namespace || !apiKey) {
            throw new HttpException(`You are not authorized to create a table under the ${body.namespace} namespace`, HttpStatus.UNAUTHORIZED);
        }

        try {
            await this.dynamicCollectionRepository.createTable(body.table_name, body.schema);
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


        try {
            await this.dynamicCollectionRepository.insertIntoTable(tableName, data);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }

        const rowsWritten = data.length;

        const jsonString = JSON.stringify(data);

        const bytes_written = Buffer.byteLength(jsonString, 'utf8');
        return { 'rows_written': rowsWritten, 'bytes_written': bytes_written };
    }

    async generateChartPng(tableName: string, xAxis: string, yAxis: string) {
        try {

            const points = await this.getCsvDataFromDB(tableName, xAxis, yAxis);
            const chart = this.createChart(points, xAxis, yAxis, tableName, 800, 600);
            const buffer = await chart.toBinary();
            return buffer;

        } catch (error) {
            throw error;
        }
    }

    async generateChartHtml(tableName: string, xAxis: string, yAxis: string) {
        try {
            const points = await this.getCsvDataFromDB(tableName, xAxis, yAxis);

            const templatePath = path.join(process.cwd(), 'libs/services/src/dune-simulator', 'chart-template.html');
            const htmlTemplate = fs.readFileSync(templatePath, 'utf8');

            const updatedHtml = htmlTemplate
                .replace(/{{chartTitle}}/g, tableName)
                .replace(/'{{labels}}'/g, JSON.stringify(points.map(point => new Date(point[0]).toISOString())))
                .replace(/'{{data}}'/g, JSON.stringify(points.map(point => point[1])))
                .replace(/{{xTitle}}/g, xAxis)
                .replace(/{{yTitle}}/g, yAxis);

            return updatedHtml;
        } catch (error) {
            throw error;
        }
    }


    createChart(points: number[][],
        xTitle: string,
        yTitle: string,
        chartName: string,
        width: number,
        height: number
    ): ChartJSImage {
        const downsampler = require('downsample-lttb');

        const downsampledData: number[][] = points.length > 2500 ? downsampler.processData(points, 2500) : points;

        const chart = new ChartJSImage();
        chart.setConfig({
            type: 'line',
            data: {
                datasets: [{
                    label: chartName,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    data: downsampledData.map(item => { return { x: item[0], y: item[1] }; }),
                    fill: true,
                    pointRadius: 0,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: `${chartName} Area Chart`,
                },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MMM yyyy',
                            },
                            tooltipFormat: 'MMM yyyy',
                        },
                        scaleLabel: {
                            display: true,
                            labelString: xTitle,
                        },
                        ticks: {
                            autoSkip: true,
                            maxRotation: 0,
                            minRotation: 0,
                        },

                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: yTitle,
                        },
                        ticks: {
                            beginAtZero: true,
                        },
                    }],
                },
            },
        });
        chart.setWidth(width).setHeight(height);

        return chart;
    }

    async getCsvDataFromDB(tableName: string, xAxis: string, yAxis: string): Promise<number[][]> {
        const records = await this.dynamicCollectionRepository.getCollectionDocuments(tableName);

        const points = [];

        try {
            for (const record of records) {
                const value = parseFloat(record[yAxis]);
                if (!isNaN(value)) {
                    points.push([Date.parse(record[xAxis]), value]);
                }
            }
        } catch (error) {
            throw error;
        }

        return points;
    }
}
