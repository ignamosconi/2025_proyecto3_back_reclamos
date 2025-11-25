// src/reclamos/dto/update-encargados.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsArray, IsOptional, ArrayUnique, IsNotEmpty } from 'class-validator';

export class UpdateEncargadosDto {
  
  /**
   * IDs de los encargados que se deben ASIGNAR al reclamo.
   */
  @ApiPropertyOptional({ 
    type: [String], 
    format: 'ObjectId', 
    description: 'Lista de IDs de encargados a añadir al equipo.', 
    example: ['60c72b2f9c3f9a0015b67e7d', '60c72b2f9c3f9a0015b67e7f'] 
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  readonly addEncargadosIds?: string[];

  /**
   * IDs de los encargados que se deben DESASIGNAR del reclamo.
   */
  @ApiPropertyOptional({ 
    type: [String], 
    format: 'ObjectId', 
    description: 'Lista de IDs de encargados a eliminar del equipo.',
    example: ['60c72b2f9c3f9a0015b67e80']
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  readonly removeEncargadosIds?: string[];
  
  // NOTA: Se podría añadir una validación de que al menos uno de los campos debe estar presente,
  // pero es más flexible dejar que la capa de servicio maneje el caso de DTO vacío.
}