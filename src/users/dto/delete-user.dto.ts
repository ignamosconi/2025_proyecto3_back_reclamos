import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({ description: 'Email del usuario a eliminar para confirmación', example: 'usuario@example.com' })
  @IsEmail()
  @IsString()
  emailConfirmation: string;
}

