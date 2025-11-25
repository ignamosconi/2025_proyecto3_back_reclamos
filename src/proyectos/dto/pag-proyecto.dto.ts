import { ApiProperty } from '@nestjs/swagger';
import { Proyecto } from '../schemas/proyecto.schema';

export class PaginationResponseProyectoDto {
  @ApiProperty({ type: () => Proyecto, isArray: true, description: 'Lista de proyectos de la página actual.' })
  data: Proyecto[];

  @ApiProperty({ description: 'Total de proyectos encontrados (sin aplicar límite).' })
  total: number;

  @ApiProperty({ description: 'Número de página actual.' })
  page: number;

  @ApiProperty({ description: 'Límite de resultados por página.' })
  limit: number;
}