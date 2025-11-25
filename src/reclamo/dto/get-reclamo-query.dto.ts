import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum, IsMongoId, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReclamo } from '../enums/estado.enum';

export class GetReclamoQueryDto {
  
  // Paginación

  @ApiPropertyOptional({ type: Number, default: 1, description: 'Número de página.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiPropertyOptional({ type: Number, default: 10, maximum: 100, description: 'Límite de elementos por página.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit: number = 10;
  
  // Filtros

  @ApiPropertyOptional({ enum: EstadoReclamo, description: 'Filtra por el estado del reclamo.' })
  @IsOptional()
  @IsEnum(EstadoReclamo)
  readonly estado?: EstadoReclamo;

  @ApiPropertyOptional({ type: String, format: 'ObjectId', description: 'Filtra por ID de Tipo de Reclamo.' })
  @IsOptional()
  @IsMongoId()
  readonly fkTipoReclamo?: string;

  @ApiPropertyOptional({ type: String, format: 'date', description: 'Fecha de inicio del rango de creación (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  readonly fechaInicio?: string;

  @ApiPropertyOptional({ type: String, format: 'date', description: 'Fecha de fin del rango de creación (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  readonly fechaFin?: string;
}