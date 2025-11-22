import { BadRequestException } from '@nestjs/common';

export const defaultWeakPatterns: string[] = [
  '1234','12345','123456','1234567','12345678','123456789','1234567890',
  '0000','1111','2222','3333','4444','5555','6666','7777','8888','9999',
  '2000','2020','2021','2022','2023','2024','2025',
  'contraseña','clave','secreta','admin','usuario','qwerty','asdf','abcdef','zxcvbn','test','password'
];

export function validatePasswordStrength(
  password: string,
  email: string,
  firstName: string,
  lastName: string,
): void {
  const minLength = 8;
  if (password.length < minLength)
    throw new BadRequestException(`La contraseña debe tener al menos ${minLength} caracteres.`);
  if (!/[A-Z]/.test(password))
    throw new BadRequestException('La contraseña debe contener al menos una letra mayúscula.');
  if (!/[a-z]/.test(password))
    throw new BadRequestException('La contraseña debe contener al menos una letra minúscula.');
  if (!/\d/.test(password))
    throw new BadRequestException('La contraseña debe contener al menos un número.');
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(password))
    throw new BadRequestException('La contraseña debe contener al menos un carácter especial.');

  const weakPatterns = defaultWeakPatterns.concat([
    email.toLowerCase(),
    firstName.toLowerCase(),
    lastName.toLowerCase(),
  ]);

  const lowerPassword = password.toLowerCase();
  for (const pattern of weakPatterns) {
    if (lowerPassword.includes(pattern)) {
      throw new BadRequestException(`La contraseña no debe contener patrones comunes o datos personales (como "${pattern}").`);
    }
  }
}
