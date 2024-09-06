import { Body, Controller, Param, Post, Headers, Get, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateTableBody } from "./entities";
import { DuneSimulatorService } from "@libs/services/dune-simulator";
import { Response } from "express";

@Controller('/api/v1/table')
@ApiTags('dune-simulator')
export class DuneSimulatorController {
    constructor(
        private readonly duneSimulatorService: DuneSimulatorService,
    ) { }

    @Post("/create")
    async createTable(
        @Headers('x-dune-api-key') apiKey: string,
        @Headers('content-type') contentType: string,
        @Body() body: CreateTableBody,
    ): Promise<any> {
        try {
            const response = await this.duneSimulatorService.createTable(apiKey, contentType, body);
            return response;
        } catch (error) {
            throw error;
        }
    }

    @Post("/:name_space/:table_name/insert")
    async insertIntoTable(
        @Param('name_space') nameSpace: string,
        @Param('table_name') tableName: string,
        @Headers('x-dune-api-key') apiKey: string,
        @Headers('content-type') contentType: string,
        @Body() body: any[],
    ): Promise<{ 'rows_written': number, 'bytes_written': number }> {
        try {
            const response = await this.duneSimulatorService.insertIntoTable(nameSpace, tableName, body, apiKey, contentType);
            return response;
        } catch (error) {
            throw error;
        }
    }

    @Get("/generate/chart/:token_pair/png")
    async generateChartPng(
        @Param('token_pair') pair: string,
        @Res() res: Response,
    ): Promise<any> {
        try {
            const imageBuffer = await this.duneSimulatorService.generateChartPng(pair);

            res.setHeader('Content-Type', 'image/png');
            res.send(imageBuffer);

        } catch (error) {
            throw error;
        }

    }

    @Get("/generate/chart/:token_pair/html")
    async generateChartHtml(
        @Param('token_pair') pair: string,
        @Res() res: Response,
    ): Promise<any> {
        try {
            const htmlContent = await this.duneSimulatorService.generateChartHtml(pair);

            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);

        } catch (error) {
            throw error;
        }

    }
}
