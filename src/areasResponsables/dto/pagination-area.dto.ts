import { ApiProperty } from '@nestjs/swagger';
import { Area } from '../schemas/area.schema';

export class PaginationAreaDto {
  @ApiProperty({ type: () => Area, isArray: true })
  data: Area[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
