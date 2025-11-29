import { ApiProperty } from '@nestjs/swagger';

export class EncuestaResponseDto {
  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  readonly _id: string;

  @ApiProperty({ example: 5, description: 'Calificación del 1 al 5, siendo 5 excelente' })
  readonly calificacion: number;

  @ApiProperty({ example: 'Excelente atención y resolución rápida del problema.' })
  readonly descripcion: string;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  readonly fkReclamo: string;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7d' })
  readonly fkClienteCreador: string;

  @ApiProperty({ type: Date, example: '2025-11-25T17:00:00.000Z' })
  readonly createdAt: Date;

  @ApiProperty({ type: Date, example: '2025-11-25T18:30:00.000Z' })
  readonly updatedAt: Date;
}

