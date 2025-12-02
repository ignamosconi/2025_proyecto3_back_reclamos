import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsIn, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAreasQueryDto {
  @ApiPropertyOptional({ description: 'Número de página', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad de resultados por página', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Orden alfabético', example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ description: 'Buscar por nombre' })
  @IsOptional()
  @IsString()
  search?: string;
}
