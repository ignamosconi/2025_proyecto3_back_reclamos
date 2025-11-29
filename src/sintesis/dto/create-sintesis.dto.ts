// src/sintesis/dto/create-sintesis.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateSintesisDto {
  @ApiPropertyOptional({ 
    example: 'Resolución del problema',
    description: 'Título opcional de la síntesis',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  readonly nombre?: string;

  @ApiProperty({ 
    example: 'Se ha revisado el problema y se ha implementado una solución. El módulo ahora funciona correctamente.',
    description: 'Contenido de la síntesis (máximo 1000 caracteres)',
    minLength: 1,
    maxLength: 1000
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  readonly descripcion: string;
}

