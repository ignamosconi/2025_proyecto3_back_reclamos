// src/dashboard/dto/dashboard-gerente-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';

export class DashboardGerenteQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Estado del reclamo para filtrar',
    enum: EstadoReclamo,
  })
  @IsOptional()
  @IsEnum(EstadoReclamo)
  estado?: EstadoReclamo;

  @ApiPropertyOptional({
    description: 'ID del proyecto para filtrar',
    example: '60c72b2f9c3f9a0015b67e7d',
  })
  @IsOptional()
  @IsMongoId()
  proyectoId?: string;

  @ApiPropertyOptional({
    description: 'Cantidad de empleados a mostrar en los rankings (default: 10)',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  topLimit?: number;
}

