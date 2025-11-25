import { IsNotEmpty, IsString, IsMongoId, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProyectoDto {
  
  @ApiProperty({
    description: 'Nombre único del proyecto. No puede repetirse.',
    example: 'Implementación de Plataforma E-commerce',
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del proyecto es obligatorio.' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres.' })
  nombre: string;

  @ApiProperty({
    description: 'ID (ObjectId) del cliente asociado.',
    example: '60c72b2f9b1d9c4c5c8a4d4b',
  })
  @IsMongoId({
    message: 'El ID del cliente debe ser un ObjectId válido de Mongo.',
  })
  @IsNotEmpty({ message: 'El cliente asociado es obligatorio.' })
  cliente: string; // Se usa string para el ObjectId

  @ApiProperty({
    description: 'ID (ObjectId) del área responsable del proyecto.',
    example: '60c72b2f9b1d9c4c5c8a4d4c',
  })
  @IsMongoId({
    message: 'El ID del área responsable debe ser un ObjectId válido de Mongo.',
  })
  @IsNotEmpty({ message: 'El área responsable es obligatoria.' })
  areaResponsable: string; // Se usa string para el ObjectId
}