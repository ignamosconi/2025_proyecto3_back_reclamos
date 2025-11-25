import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; //

export class CreateAreaDto {
  @ApiProperty({
    description: 'Nombre único del Área Responsable (ej: Soporte Técnico, Ventas).',
    example: 'Facturación',
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del área no puede estar vacío.' })
  @MaxLength(100, { message: 'El nombre no debe exceder los 100 caracteres.' })
  readonly name: string;
}