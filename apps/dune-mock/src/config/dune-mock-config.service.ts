import { configuration } from "@libs/common/config/configuration";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DuneMockConfigService {
  readonly config = configuration().apps.duneMock;

}
