import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTipoReclamoDto {
  @ApiProperty({ description: 'Nombre del tipo de reclamo', minLength: 3 })
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del tipo de reclamo' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
