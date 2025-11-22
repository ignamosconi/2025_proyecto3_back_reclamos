//US 3-4: Actualización para cliente
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Nombre del usuario', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ description: 'Apellido del usuario', required: false })
  @IsOptional()
  @IsString()
  apellido?: string;

  @ApiProperty({ description: 'Correo electrónico', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Nueva contraseña', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ description: 'Confirmación de la contraseña', required: false })
  @IsOptional()
  @IsString()
  passwordConfirmation?: string;
}
