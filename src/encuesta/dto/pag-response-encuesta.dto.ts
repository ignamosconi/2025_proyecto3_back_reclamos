import { ApiProperty } from '@nestjs/swagger';
import { EncuestaResponseDto } from './encuesta-response.dto';

export class PaginationResponseEncuestaDto {
  @ApiProperty({ type: () => EncuestaResponseDto, isArray: true })
  data: EncuestaResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

