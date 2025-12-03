import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponsableDto {
  @ApiProperty({ description: 'ID del responsable' })
  _id: string;

  @ApiProperty({ description: 'Nombre del responsable' })
  firstName: string;

  @ApiProperty({ description: 'Apellido del responsable' })
  lastName: string;

  @ApiProperty({ description: 'Email del responsable' })
  email: string;
}

export class HistorialMetadataDto {
  @ApiPropertyOptional({ description: 'Estado anterior del reclamo' })
  estado_anterior?: string;

  @ApiPropertyOptional({ description: 'Estado actual/nuevo del reclamo' })
  estado_actual?: string;

  @ApiPropertyOptional({ description: 'ID de la síntesis creada' })
  sintesis_id?: string;

  // Otros datos adicionales: index signature (decorators are not allowed on index signatures)
  [key: string]: any;
}

export class HistorialResponseDto {
  @ApiProperty({ description: 'ID del historial' })
  _id: string;

  @ApiProperty({ description: 'Fecha y hora del evento' })
  fecha_hora: Date;

  @ApiProperty({ type: ResponsableDto, description: 'Usuario responsable del evento' })
  responsable: ResponsableDto;

  @ApiProperty({ description: 'Tipo de acción realizada' })
  accion: string;

  @ApiProperty({ description: 'Detalle de la acción' })
  detalle: string;

  @ApiPropertyOptional({ type: HistorialMetadataDto, description: 'Metadata adicional del evento' })
  metadata?: HistorialMetadataDto;

  @ApiProperty({ description: 'ID del reclamo' })
  reclamoId: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}
