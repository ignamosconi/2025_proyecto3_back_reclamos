// src/dashboard/dto/dashboard-cliente-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ClaimsPerProjectDto {
  @ApiProperty({ description: 'ID del proyecto' })
  proyectoId: string;

  @ApiProperty({ description: 'Nombre del proyecto' })
  proyectoNombre: string;

  @ApiProperty({ description: 'Cantidad de reclamos' })
  cantidad: number;
}

export class ClaimsByStatusDto {
  @ApiProperty({ description: 'Estado del reclamo' })
  estado: string;

  @ApiProperty({ description: 'Cantidad de reclamos' })
  cantidad: number;
}

export class DashboardClienteResponseDto {
  @ApiProperty({
    description: 'Gráfico de barras: cantidad de reclamos por proyecto',
    type: [ClaimsPerProjectDto],
  })
  claimsPerProject: ClaimsPerProjectDto[];

  @ApiProperty({
    description: 'Gráfico de barras: cantidad de reclamos por estado (filtrado por proyecto si se especifica)',
    type: [ClaimsByStatusDto],
  })
  claimsByStatus: ClaimsByStatusDto[];

  @ApiProperty({
    description: 'Tiempo promedio de resolución en días (desde creación hasta estado final)',
    example: 5.5,
  })
  averageResolutionTime: number;

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

