import { IsOptional, IsInt, Min, IsEnum, IsString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProyectosQueryDto {
  
  // --- Parámetros de Paginación y Ordenación ---

  @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1.' })
  page: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad de resultados por página', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1.' })
  limit: number = 10;

  @ApiPropertyOptional({ 
    description: 'Campo por el que ordenar. Usar prefijo "-" para descendente (ej: -fechaInicio).', 
    example: 'nombre', 
    default: 'createdAt'
  })
  @IsOptional()
  @IsString({ message: 'El parámetro de ordenación debe ser un string.' })
  sort?: string = 'createdAt'; 

  // --- Filtros Específicos de Proyecto ---

  @ApiPropertyOptional({ 
    description: 'Filtrar por ID de cliente asociado.', 
    example: '651a89c1f0e4b868e4c70d4f' 
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del cliente debe ser un ObjectId válido.' })
  cliente?: string; 

  @ApiPropertyOptional({ 
    description: 'Filtrar por ID de área responsable.', 
    example: '651a89c1f0e4b868e4c70d50' 
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del área responsable debe ser un ObjectId válido.' })
  areaResponsable?: string;

  @ApiPropertyOptional({ description: 'Buscar texto en nombre o descripción.' })
  @IsOptional()
  @IsString({ message: 'El campo de búsqueda debe ser un string.' })
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por estado del proyecto. "activo" para proyectos no eliminados, "inactivo" para eliminados.', 
    example: 'activo',
    enum: ['activo', 'inactivo']
  })
  @IsOptional()
  @IsEnum(['activo', 'inactivo'], { message: 'El estado debe ser "activo" o "inactivo".' })
  estado?: 'activo' | 'inactivo';
}