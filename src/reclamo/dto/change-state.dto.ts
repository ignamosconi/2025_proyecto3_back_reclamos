// src/reclamo/dto/change-state.dto.ts

import { IsEnum, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoReclamo } from '../enums/estado.enum';

export class ChangeStateDto {
  @ApiProperty({ enum: EstadoReclamo })
  @IsEnum(EstadoReclamo)
  estado: EstadoReclamo;

  @ApiPropertyOptional({ description: 'Título opcional de la síntesis', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  @ApiPropertyOptional({ description: 'Síntesis o motivo (requerido al resolver o rechazar). Máximo 1000 caracteres.', minLength: 1, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  sintesis?: string;
}
