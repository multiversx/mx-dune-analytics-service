import { ApiProperty } from "@nestjs/swagger";

export class TableSchema {
    constructor(init?: Partial<TableSchema>) {
        Object.assign(this, init);
    }
    @ApiProperty()
    name!: string;
}

export class CreateTableBody {
    constructor(init?: Partial<CreateTableBody>) {
        Object.assign(this, init);
    }

    @ApiProperty()
    tableName!: string;

    @ApiProperty()
    schema!: TableSchema[];
}

