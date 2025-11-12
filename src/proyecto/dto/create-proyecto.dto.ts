// src/projects/dto/create-project.dto.ts

import { IsString, IsNotEmpty, IsMongoId, MinLength, IsOptional } from 'class-validator';

export class CreateProyectoDto {
  // Criterio: 'nombre' obligatorio y con restricción de longitud.
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del proyecto es obligatorio.' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  readonly name: string;

  // Criterio: 'cliente asociado' obligatorio (FK - idCliente). Debe ser un ObjectId válido.
  //@IsMongoId({ message: 'El ID del cliente asociado no es válido.' })
  @IsNotEmpty({ message: 'El cliente asociado es obligatorio.' })
  readonly client: string; // Se recibe como string en el DTO

  // Criterio: 'área responsable' obligatoria (FK - idÁrea). Debe ser un ObjectId válido.
  //@IsMongoId({ message: 'El ID del área responsable no es válido.' })
  @IsNotEmpty({ message: 'El área responsable es obligatoria.' })
  readonly responsibleArea: string; // Se recibe como string en el DTO

  // Campo opcional para descripción
//   @IsOptional()
//   @IsString({ message: 'La descripción debe ser una cadena de texto.' })
//   readonly description?: string;
}