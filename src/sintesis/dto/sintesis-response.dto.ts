// src/sintesis/dto/sintesis-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreadorResponseDto {
  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  readonly _id: string;

  @ApiProperty({ example: 'Juan' })
  readonly firstName: string;

  @ApiProperty({ example: 'Pérez' })
  readonly lastName: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  readonly email: string;

  @ApiProperty({ example: 'ENCARGADO' })
  readonly role: string;
}

export class AreaResponseDto {
  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7e' })
  readonly _id: string;

  @ApiProperty({ example: 'Soporte Técnico' })
  readonly nombre: string;

  @ApiPropertyOptional({ example: 'Área de soporte técnico' })
  readonly descripcion?: string;
}

export class SintesisResponseDto {
  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  readonly _id: string;

  @ApiPropertyOptional({ example: 'Resolución del problema' })
  readonly nombre?: string;

  @ApiProperty({ 
    example: 'Se ha revisado el problema y se ha implementado una solución. El módulo ahora funciona correctamente.'
  })
  readonly descripcion: string;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7c' })
  readonly fkReclamo: string;

  @ApiProperty({ type: CreadorResponseDto })
  readonly fkCreador: CreadorResponseDto;

  @ApiProperty({ type: AreaResponseDto })
  readonly fkArea: AreaResponseDto;

  @ApiProperty({ type: Date, example: '2025-11-25T17:00:00.000Z' })
  readonly createdAt: Date;

  @ApiProperty({ type: Date, example: '2025-11-25T18:30:00.000Z' })
  readonly updatedAt: Date;
}

