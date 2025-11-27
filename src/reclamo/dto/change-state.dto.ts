import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoReclamo } from '../enums/estado.enum';

export class ChangeStateDto {
  @ApiProperty({ enum: EstadoReclamo })
  @IsEnum(EstadoReclamo)
  estado: EstadoReclamo;

  @ApiPropertyOptional({ description: 'Síntesis o motivo (requerido al resolver o rechazar)', minLength: 5 })
  @IsOptional()
  @IsString()
  @MinLength(5)
  sintesis?: string;
}
