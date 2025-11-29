// src/dashboard/dto/dashboard-gerente-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class WorkloadByAreaDto {
  @ApiProperty({ description: 'ID del área' })
  areaId: string;

  @ApiProperty({ description: 'Nombre del área' })
  areaNombre: string;

  @ApiProperty({ description: 'Cantidad de reclamos' })
  cantidad: number;
}

export class TopEmployeeByResolvedDto {
  @ApiProperty({ description: 'ID del empleado' })
  empleadoId: string;

  @ApiProperty({ description: 'Nombre completo del empleado' })
  empleadoNombre: string;

  @ApiProperty({ description: 'Email del empleado' })
  empleadoEmail: string;

  @ApiProperty({ description: 'Cantidad de reclamos resueltos' })
  cantidadResueltos: number;
}

export class TopEmployeeByEfficiencyDto {
  @ApiProperty({ description: 'ID del empleado' })
  empleadoId: string;

  @ApiProperty({ description: 'Nombre completo del empleado' })
  empleadoNombre: string;

  @ApiProperty({ description: 'Email del empleado' })
  empleadoEmail: string;

  @ApiProperty({ description: 'Tiempo promedio de resolución en días' })
  promedioDias: number;
}

export class DistributionByTypeDto {
  @ApiProperty({ description: 'ID del tipo de reclamo' })
  tipoReclamoId: string;

  @ApiProperty({ description: 'Nombre del tipo de reclamo' })
  tipoReclamoNombre: string;

  @ApiProperty({ description: 'Cantidad de reclamos' })
  cantidad: number;

  @ApiProperty({ description: 'Porcentaje del total' })
  porcentaje: number;
}

export class DashboardGerenteResponseDto {
  @ApiProperty({
    description: 'Carga de trabajo por área',
    type: [WorkloadByAreaDto],
  })
  workloadByArea: WorkloadByAreaDto[];

  @ApiProperty({
    description: 'Cantidad total de reclamos',
  })
  totalClaims: number;

  @ApiProperty({
    description: 'Top empleados que más reclamos resolvieron',
    type: [TopEmployeeByResolvedDto],
  })
  topEmployeesByResolved: TopEmployeeByResolvedDto[];

  @ApiProperty({
    description: 'Top empleados por eficiencia (menor tiempo promedio de resolución)',
    type: [TopEmployeeByEfficiencyDto],
  })
  topEmployeesByEfficiency: TopEmployeeByEfficiencyDto[];

  @ApiProperty({
    description: 'Cantidad de modificaciones de estados',
  })
  stateChangesCount: number;

  @ApiProperty({
    description: 'Distribución de reclamos por tipo de reclamo',
    type: [DistributionByTypeDto],
  })
  distributionByType: DistributionByTypeDto[];

  @ApiProperty({
    description: 'Porcentaje de reclamos con criticidad = "SÍ"',
    example: 15.5,
  })
  percentageCriticalClaims: number;

  @ApiProperty({
    description: 'Rango de fechas utilizado para el filtrado',
  })
  dateRange: {
    start: Date;
    end: Date;
  };
}

