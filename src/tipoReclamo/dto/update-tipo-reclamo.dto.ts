import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTipoReclamoDto {
  @ApiPropertyOptional({ description: 'Nombre del tipo de reclamo', minLength: 3 })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción del tipo de reclamo' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
