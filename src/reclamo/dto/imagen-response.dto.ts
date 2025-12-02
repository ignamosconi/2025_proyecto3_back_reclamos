// src/reclamo/dto/imagen-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ImagenResponseDto {
  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  readonly _id: string;

  @ApiProperty({ example: 'evidencia-1.png' })
  readonly nombre: string;

  @ApiProperty({ example: 'image/png' })
  readonly tipo: string;

  @ApiProperty({ 
    description: 'URL de la imagen (base64 data URL o URL del servidor)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
  })
  readonly url: string;

  @ApiProperty({ type: String, format: 'ObjectId' })
  readonly fkReclamo: string;

  @ApiProperty({ type: Date, example: '2025-11-25T17:00:00.000Z' })
  readonly createdAt: Date;

  @ApiProperty({ type: Date, example: '2025-11-25T18:30:00.000Z' })
  readonly updatedAt: Date;
}


