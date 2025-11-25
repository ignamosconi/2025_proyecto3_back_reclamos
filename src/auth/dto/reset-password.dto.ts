//ARCHIVO: reset-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDTO {
  @ApiProperty({
    example: 'abc123tokenjwtreset',
    description: 'Token de recuperación recibido por email',
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NuevaPassword123*',
    description: 'Nueva contraseña del usuario',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
