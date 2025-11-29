// src/dashboard/dto/dashboard-encargado-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ClaimsPerMonthDto {
  @ApiProperty({ description: 'Año' })
  year: number;

  @ApiProperty({ description: 'Mes (1-12)' })
  month: number;

  @ApiProperty({ description: 'Cantidad de reclamos resueltos' })
  resueltos: number;

  @ApiProperty({ description: 'Cantidad de reclamos no resueltos' })
  noResueltos: number;

  @ApiProperty({ description: 'Total de reclamos' })
  total: number;
}

export class ClaimsByTypeDto {
  @ApiProperty({ description: 'ID del tipo de reclamo' })
  tipoReclamoId: string;

  @ApiProperty({ description: 'Nombre del tipo de reclamo' })
  tipoReclamoNombre: string;

  @ApiProperty({ description: 'Cantidad de reclamos' })
  cantidad: number;
}

export class AverageResolutionTimeByTypeDto {
  @ApiProperty({ description: 'ID del tipo de reclamo' })
  tipoReclamoId: string;

  @ApiProperty({ description: 'Nombre del tipo de reclamo' })
  tipoReclamoNombre: string;

  @ApiProperty({ description: 'Tiempo promedio de resolución en días' })
  promedioDias: number;
}

export class ResolvedClaimsPeriodDto {
  @ApiProperty({ description: 'Período (semana, día o mes)' })
  periodo: string;

  @ApiProperty({ description: 'Cantidad de reclamos resueltos' })
  cantidad: number;
}

export class DashboardEncargadoResponseDto {
  @ApiProperty({
    description: 'Cantidad de reclamos por mes (resueltos y no resueltos)',
    type: [ClaimsPerMonthDto],
  })
  claimsPerMonth: ClaimsPerMonthDto[];

  @ApiProperty({
    description: 'Cantidad de reclamos por tipo',
    type: [ClaimsByTypeDto],
  })
  claimsByType: ClaimsByTypeDto[];

  @ApiProperty({
    description: 'Tiempo promedio de resolución según el tipo de reclamo',
    type: [AverageResolutionTimeByTypeDto],
  })
  averageResolutionTimeByType: AverageResolutionTimeByTypeDto[];

  @ApiProperty({
    description: 'Cantidad de reclamos resueltos por período (semana, día o mes)',
    type: [ResolvedClaimsPeriodDto],
  })
  resolvedClaimsByPeriod: ResolvedClaimsPeriodDto[];

  @ApiProperty({
    description: 'Promedio de reclamos resueltos por período',
    example: 2.5,
  })
  averageResolvedPerPeriod: number;

  @ApiProperty({
    description: 'Rango de fechas utilizado para el filtrado',
  })
  dateRange: {
    start: Date;
    end: Date;
  };

  @ApiProperty({
    description: 'Total de reclamos en el rango',
  })
  totalClaims: number;
}

