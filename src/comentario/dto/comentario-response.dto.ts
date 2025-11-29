import { ApiProperty } from '@nestjs/swagger';

export class AutorComentarioDto {
  @ApiProperty({ example: '60c72b2f9c3f9a0015b67e7d' })
  _id: string;

  @ApiProperty({ example: 'Juan' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  email: string;
}

export class ComentarioResponseDto {
  @ApiProperty({ example: '60c72b2f9c3f9a0015b67e8a' })
  _id: string;

  @ApiProperty({ 
    example: 'Necesitamos revisar este caso con el equipo de desarrollo.',
    maxLength: 1000,
  })
  texto: string;

  @ApiProperty({ type: AutorComentarioDto })
  autor: AutorComentarioDto;

  @ApiProperty({ example: '60c72b2f9c3f9a0015b67e7c' })
  fkReclamo: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  fecha_hora: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

