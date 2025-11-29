import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateComentarioDto {
  @ApiProperty({
    description: 'Texto del comentario interno (máximo 1000 caracteres).',
    example: 'Necesitamos revisar este caso con el equipo de desarrollo.',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'El texto del comentario no puede exceder 1000 caracteres.' })
  texto: string;
}

