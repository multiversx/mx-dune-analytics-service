import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import csv from 'csv-parser';

@Injectable()
export class CsvParserMiddleware implements NestMiddleware {
  use(req: Request, _: Response, next: NextFunction) {
    if (req.headers['content-type'] === 'text/csv') {
      const results: any = [];
      req.pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => {
          req.body = results;
          next();
        });
    } else {
      next();
    }
  }
}
