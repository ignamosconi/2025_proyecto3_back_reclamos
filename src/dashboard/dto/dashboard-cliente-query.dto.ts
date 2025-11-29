// src/dashboard/dto/dashboard-cliente-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardClienteQueryDto {
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
    description: 'ID del proyecto para filtrar el gráfico de estados',
    example: '60c72b2f9c3f9a0015b67e7d',
  })
  @IsOptional()
  proyectoId?: string;
}

