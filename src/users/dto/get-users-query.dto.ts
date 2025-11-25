import { IsOptional, IsInt, Min, IsIn, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../helpers/enum.roles';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ description: 'Número de página', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Cantidad de resultados por página', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Orden alfabético', example: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ description: 'Filtrar por rol', enum: ['Cliente', 'Encargado', 'Gerente'] })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Buscar por nombre, apellido o email' })
  @IsOptional()
  @IsString()
  search?: string;
}
