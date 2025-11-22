import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAreaDto {
  @ApiProperty({ description: 'Nombre del área', minLength: 3 })
  @IsString()
  @MinLength(3)
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del área' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}