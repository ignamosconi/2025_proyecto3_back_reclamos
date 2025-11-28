import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsMongoId, IsOptional, IsBoolean } from 'class-validator';
import { Prioridad } from '../enums/prioridad.enum';
import { Criticidad } from '../enums/criticidad.enum';


export class CreateReclamoDto {

  @ApiProperty({ example: 'Fallo al exportar reporte de ventas' })
  @IsNotEmpty()
  @IsString()
  readonly titulo: string;

  @ApiProperty({ example: 'El botón de exportar en el módulo de reportes no genera el archivo PDF.' })
  @IsNotEmpty()
  @IsString()
  readonly descripcion: string;

  @ApiProperty({ enum: Prioridad, example: Prioridad.ALTA })
  @IsNotEmpty()
  @IsEnum(Prioridad)
  readonly prioridad: Prioridad;

  @ApiProperty({ enum: Criticidad, example: Criticidad.SI })
  @IsNotEmpty()
  @IsEnum(Criticidad)
  readonly criticidad: Criticidad;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7d' })
  @IsNotEmpty()
  @IsMongoId()
  readonly fkProyecto: string;

  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e7e' })
  @IsNotEmpty()
  @IsMongoId()
  readonly fkTipoReclamo: string;

}