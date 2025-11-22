// helpers/password.validator.ts
import { BadRequestException } from '@nestjs/common';
import { PasswordValidationResponseDto } from '../dto/pswd-validation-response.dto';
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
  const errors: string[] = [];
  const minLength = 8;

  // Validaciones básicas
  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres.`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula.');
  }
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número.');
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\]~`]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial.');
  }

  // Patrones débiles / datos personales
  const weakPatterns = defaultWeakPatterns.concat([
    email.toLowerCase(),
    firstName.toLowerCase(),
    lastName.toLowerCase(),
  ]);

  const lowerPassword = password.toLowerCase();
  for (const pattern of weakPatterns) {
    if (pattern && lowerPassword.includes(pattern)) {
      errors.push(`No debe contener patrones comunes o datos personales (como "${pattern}").`);
    }
  }

  // Si hay errores, lanzamos BadRequestException con DTO
  if (errors.length > 0) {
    const response: PasswordValidationResponseDto = {
      message: 'Contraseña débil',
      errors,
    };
    throw new BadRequestException(response);
  }
}
