// src/dashboard/dto/dashboard-encargado-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsMongoId } from 'class-validator';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';

export class DashboardEncargadoQueryDto {
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
    description: 'Día específico para filtrar (ISO 8601). Si se proporciona, ignora startDate y endDate',
    example: '2024-06-15',
  })
  @IsOptional()
  @IsDateString()
  specificDay?: string;

  @ApiPropertyOptional({
    description: 'ID del cliente para filtrar',
    example: '60c72b2f9c3f9a0015b67e7c',
  })
  @IsOptional()
  @IsMongoId()
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'ID del proyecto para filtrar',
    example: '60c72b2f9c3f9a0015b67e7d',
  })
  @IsOptional()
  @IsMongoId()
  proyectoId?: string;

  @ApiPropertyOptional({
    description: 'ID del tipo de reclamo para filtrar',
    example: '60c72b2f9c3f9a0015b67e7e',
  })
  @IsOptional()
  @IsMongoId()
  tipoReclamoId?: string;

  @ApiPropertyOptional({
    description: 'Estado del reclamo para filtrar',
    enum: EstadoReclamo,
  })
  @IsOptional()
  @IsEnum(EstadoReclamo)
  estado?: EstadoReclamo;

  @ApiPropertyOptional({
    description: 'ID del área para filtrar',
    example: '60c72b2f9c3f9a0015b67e7f',
  })
  @IsOptional()
  @IsMongoId()
  areaId?: string;
}

