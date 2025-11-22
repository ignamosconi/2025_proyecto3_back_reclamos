import { IsEmail, IsString, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'Nombre del usuario', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({ description: 'Apellido del usuario', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  apellido: string;

  @ApiProperty({ description: 'Correo electrónico', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ description: 'Contraseña segura del usuario' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Confirmación de contraseña' })
  @IsString()
  @IsNotEmpty()
  passwordConfirmation: string;
}
