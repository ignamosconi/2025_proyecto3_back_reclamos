//ARCHIVO: forgot-password.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDTO {
  @ApiProperty({
    example: 'cliente@mail.com',
    description: 'Email asociado a la cuenta',
  })
  @IsEmail()
  email: string;
}
