import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, Max, IsString } from 'class-validator';

export class CreateEncuestaDto {
  @ApiProperty({ example: 5, description: 'Calificación del 1 al 5, siendo 5 excelente', minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  readonly calificacion: number;

  @ApiProperty({ example: 'Excelente atención y resolución rápida del problema.' })
  @IsNotEmpty()
  @IsString()
  readonly descripcion: string;
}

