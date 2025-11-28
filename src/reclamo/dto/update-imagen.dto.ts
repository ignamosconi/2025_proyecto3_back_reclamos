import { IsBase64, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateImagenDto {
  @ApiPropertyOptional({ example: 'evidencia-1.png' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ description: 'Imagen en base64 (sin data:<mime>;base64, solo el payload)' })
  @IsOptional()
  @IsBase64()
  @MinLength(20)
  imagen?: string;
}
