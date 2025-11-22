import { ApiProperty } from '@nestjs/swagger';
import { TipoReclamo } from '../schemas/tipo-reclamo.schema';

export class PaginationTipoDto {
  @ApiProperty({ type: () => TipoReclamo, isArray: true })
  data: TipoReclamo[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}