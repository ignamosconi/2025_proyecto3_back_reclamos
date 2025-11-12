import { IsOptional, IsMongoId } from 'class-validator';

export class FilterProyectoDto {
  // Criterio: "filtrar por cliente"
  @IsOptional()
  //@IsMongoId({ message: 'El ID del cliente para filtrar no es válido.' })
  readonly client?: string; // Filtrar por idCliente (FK)

  // Criterio: "filtrar por área responsable"
  @IsOptional()
  //@IsMongoId({ message: 'El ID del área responsable para filtrar no es válido.' })
  readonly responsibleArea?: string; // Filtrar por idÁrea (FK)

  // Nota: El campo 'status' ha sido ignorado según tu indicación.
}