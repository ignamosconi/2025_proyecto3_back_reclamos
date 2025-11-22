import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAreaDto {
  @ApiPropertyOptional({ description: 'Nombre del área', minLength: 3 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción del área' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}