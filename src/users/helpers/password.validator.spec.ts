import { validatePasswordStrength } from './password.validator';
import { BadRequestException } from '@nestjs/common';

describe('PasswordValidator', () => {
  const validEmail = 'test@example.com';
  const validFirstName = 'John';
  const validLastName = 'Doe';

  describe('validatePasswordStrength - Partición de Equivalencia', () => {
    // Clase de Equivalencia Válida
    it('debería aceptar una contraseña fuerte', () => {
      const strongPassword = 'StrongPass123!';
      expect(() =>
        validatePasswordStrength(
          strongPassword,
          validEmail,
          validFirstName,
          validLastName,
        ),
      ).not.toThrow();
    });

    // Clases de Equivalencia Inválidas (Longitud)
    it('debería rechazar contraseñas cortas (< 8 caracteres)', () => {
      const shortPassword = 'Short1!';
      try {
        validatePasswordStrength(
          shortPassword,
          validEmail,
          validFirstName,
          validLastName,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse().errors).toContain(
          'La contraseña debe tener al menos 8 caracteres.',
        );
      }
    });

    // Clases de Equivalencia Inválidas (Complejidad)
    it('debería rechazar contraseñas sin mayúsculas', () => {
      const noUpper = 'weakpass123!';
      try {
        validatePasswordStrength(
          noUpper,
          validEmail,
          validFirstName,
          validLastName,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse().errors).toContain(
          'Debe contener al menos una letra mayúscula.',
        );
      }
    });

    it('debería rechazar contraseñas sin minúsculas', () => {
      const noLower = 'WEAKPASS123!';
      try {
        validatePasswordStrength(
          noLower,
          validEmail,
          validFirstName,
          validLastName,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse().errors).toContain(
          'Debe contener al menos una letra minúscula.',
        );
      }
    });

    it('debería rechazar contraseñas sin números', () => {
      const noNumber = 'WeakPass!';
      try {
        validatePasswordStrength(
          noNumber,
          validEmail,
          validFirstName,
          validLastName,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse().errors).toContain(
          'Debe contener al menos un número.',
        );
      }
    });

    it('debería rechazar contraseñas sin caracteres especiales', () => {
      const noSpecial = 'WeakPass123';
      try {
        validatePasswordStrength(
          noSpecial,
          validEmail,
          validFirstName,
          validLastName,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse().errors).toContain(
          'Debe contener al menos un carácter especial.',
        );
      }
    });

    // Clases de Equivalencia Inválidas (Patrones Débiles)
    it('debería rechazar patrones débiles comunes (ej. 123456)', () => {
      const weakPattern = 'Pass123456!';
      try {
        validatePasswordStrength(
          weakPattern,
          validEmail,
          validFirstName,
          validLastName,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse().errors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('No debe contener patrones comunes'),
          ]),
        );
      }
    });

    // Clases de Equivalencia Inválidas (Datos Personales)
    it('debería rechazar si contiene el email', () => {
      const emailInPass = 'Test@example.com1!';
      try {
        validatePasswordStrength(
          emailInPass,
          validEmail,
          validFirstName,
          validLastName,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse().errors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('No debe contener patrones comunes'),
          ]),
        );
      }
    });

    it('debería rechazar si contiene el nombre', () => {
      const nameInPass = 'JohnPass123!';
      try {
        validatePasswordStrength(
          nameInPass,
          validEmail,
          validFirstName,
          validLastName,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getResponse().errors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('No debe contener patrones comunes'),
          ]),
        );
      }
    });
  });
});
