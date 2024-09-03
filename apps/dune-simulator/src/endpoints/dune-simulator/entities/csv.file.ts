import { ApiProperty } from "@nestjs/swagger";
import BigNumber from "bignumber.js";

export class CsvFileEntity {
    constructor(init?: Partial<CsvFile>) {
        Object.assign(this, init);
    }

    @ApiProperty()
    timestamp!: string;

    @ApiProperty()
    volumeusd!: BigNumber;
}

export class CsvFile {
    constructor(init?: Partial<CsvFile>) {
        Object.assign(this, init);
    }
    @ApiProperty()
    headers!: string;

    @ApiProperty()
    schema!: string[];
}
