//Archivo creado para la documentación de swagger, ya que en el código normal usamos el schema
//y omitimos mostrar el atributo password.

import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  apellido: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  rol: string;

  @ApiProperty({ type: [String], description: 'IDs de las áreas asociadas' })
  areas: string[];

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
