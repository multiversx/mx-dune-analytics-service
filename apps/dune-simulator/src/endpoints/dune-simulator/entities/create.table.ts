import { ApiProperty } from "@nestjs/swagger";

export class TableSchema {
  constructor(init?: Partial<TableSchema>) {
    Object.assign(this, init);
  }
  @ApiProperty()
  name!: string;

  @ApiProperty()
  type!: string;
}

export class CreateTableBody {
  constructor(init?: Partial<CreateTableBody>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  namespace!: string;

  @ApiProperty()
  table_name!: string;

  @ApiProperty()
  description?: string = "";

  @ApiProperty()
  schema!: TableSchema[];

  @ApiProperty()
  is_private!: boolean;
}

