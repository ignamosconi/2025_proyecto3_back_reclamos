// src/reclamos/dto/create-reclamo-encargado.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateReclamoEncargadoDto {
  
  @ApiProperty({ 
    description: 'ID del reclamo a asignar',
    type: String,
    format: 'ObjectId',
    example: '60c72b2f9c3f9a0015b67e7d' 
  })
  @IsNotEmpty()
  @IsMongoId()
  readonly idReclamo: string;

  @ApiProperty({ 
    description: 'ID del encargado (usuario Staff) a asignar',
    type: String,
    format: 'ObjectId',
    example: '60c72b2f9c3f9a0015b67e7e' 
  })
  @IsNotEmpty()
  @IsMongoId()
  readonly idEncargado: string;
}