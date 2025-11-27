import { IsBase64, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateImagenDto {
  @ApiProperty({ example: 'evidencia-1.png' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ description: 'Imagen en base64 (sin data:<mime>;base64, solo el payload)' })
  @IsBase64()
  @MinLength(20)
  imagen: string;
}
