import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AddEncargadoDto {
  @ApiProperty({
    description: 'ID del encargado a añadir al reclamo',
    type: String,
    format: 'ObjectId',
    example: '60c72b2f9c3f9a0015b67e7d'
  })
  @IsNotEmpty({ message: 'El ID del encargado es requerido' })
  @IsMongoId({ message: 'El ID del encargado debe ser un ObjectId válido' })
  readonly encargadoId: string;
}
