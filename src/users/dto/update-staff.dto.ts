import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, IsArray, ArrayUnique, IsMongoId, ArrayNotEmpty } from 'class-validator';
import { UserRole } from '../helpers/enum.roles';

export class UpdateStaffDto {
  @ApiProperty({ description: 'Nombre del usuario', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'Apellido del usuario', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

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

  @ApiProperty({ description: 'Rol del usuario', enum: UserRole, required: false })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ description: 'Áreas responsables asignadas al usuario', type: [String], required: false })
  @IsMongoId({ each: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  areaIds?: string[];
}
