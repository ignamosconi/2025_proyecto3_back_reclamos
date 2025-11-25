import { IsEmail, IsString, IsEnum, MinLength, MaxLength, IsArray, ArrayNotEmpty, ArrayUnique, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StaffRole } from '../helpers/enum.roles';

export class CreateStaffDto {
  @ApiProperty({ description: 'Nombre del usuario', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  lastName: string;

  @ApiProperty({ description: 'Correo electrónico', maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ description: 'Rol del usuario', enum: ['Encargado', 'Gerente'] })
  @IsEnum(StaffRole)
  role: StaffRole;

  @ApiProperty({ description: 'Áreas responsables a las que pertenece el usuario', type: [String] })
  @IsMongoId({ each: true })
  @IsArray()
  @ArrayNotEmpty({ message: 'Un staff debe tener al menos un área asignada' })
  @ArrayUnique()
  areaIds: string[];

  @ApiProperty({ description: 'Contraseña segura del usuario', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Confirmación de contraseña', minLength: 8 })
  @IsString()
  @MinLength(8)
  passwordConfirmation: string;
}
