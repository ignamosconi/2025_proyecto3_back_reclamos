import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/helpers/enum.roles';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLIENTE,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      setResetPasswordToken: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      findByResetToken: jest.fn(),
      updatePassword: jest.fn(),
    };

    mockJwtService = {
      generateToken: jest.fn(),
      refreshToken: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'IUsersService', useValue: mockUsersService },
        { provide: 'IJwtService', useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login - Tabla de Decisión', () => {
    // Tabla de Decisión:
    // | Caso | Usuario Existe? | Password Correcto? | Resultado Esperado |
    // |------|-----------------|--------------------|--------------------|
    // | 1    | Sí              | Sí                 | Retorna Tokens     |
    // | 2    | No              | N/A                | UnauthorizedException (Email) |
    // | 3    | Sí              | No                 | UnauthorizedException (Password) |

    test.each([
      {
        desc: 'Caso 1: Usuario existe y password correcto -> Retorna Tokens',
        userExists: true,
        passCorrect: true,
        expectedError: null,
      },
      {
        desc: 'Caso 2: Usuario no existe -> UnauthorizedException (Email)',
        userExists: false,
        passCorrect: false, // Irrelevante
        expectedError: 'No se pudo loguear. Correo electrónico inválido.',
      },
      {
        desc: 'Caso 3: Usuario existe pero password incorrecto -> UnauthorizedException (Password)',
        userExists: true,
        passCorrect: false,
        expectedError: 'No se pudo loguear. Contraseña incorrecta.',
      },
    ])('$desc', async ({ userExists, passCorrect, expectedError }) => {
      mockUsersService.findByEmail.mockResolvedValue(
        userExists ? mockUser : null,
      );
      (bcrypt.compareSync as jest.Mock).mockReturnValue(passCorrect);
      mockJwtService.generateToken.mockReturnValue('token');

      if (expectedError) {
        await expect(
          service.login({ email: 'test@example.com', password: 'pass' }),
        ).rejects.toThrow(expectedError);
      } else {
        const result = await service.login({
          email: 'test@example.com',
          password: 'pass',
        });
        expect(result).toEqual({ accessToken: 'token', refreshToken: 'token' });
      }
    });
  });

  describe('resetPassword - Partición de Equivalencia y Valores Límite', () => {
    // Particiones de Equivalencia:
    // 1. Token válido y tiempo válido (Futuro) -> Éxito
    // 2. Token inválido (No encontrado) -> Error
    // 3. Token válido pero expirado (Pasado) -> Error
    // 4. Token válido pero expiración null -> Error (Edge Case)

    it('debería actualizar contraseña con token válido y no expirado', async () => {
      const futureDate = new Date(Date.now() + 3600000); // +1 hora
      const user = { ...mockUser, resetPasswordExpires: futureDate };
      mockUsersService.findByResetToken.mockResolvedValue(user);

      const result = await service.resetPassword('valid-token', 'NewPass123!');

      expect(result.message).toBe('Contraseña actualizada correctamente.');
      expect(mockUsersService.updatePassword).toHaveBeenCalled();
    });

    it('debería rechazar token inexistente', async () => {
      mockUsersService.findByResetToken.mockResolvedValue(null);
      await expect(
        service.resetPassword('invalid', 'NewPass123!'),
      ).rejects.toThrow('Token inválido o expirado');
    });

    it('debería rechazar token expirado (Valor Límite: Pasado)', async () => {
      const pastDate = new Date(Date.now() - 1000); // -1 segundo
      const user = { ...mockUser, resetPasswordExpires: pastDate };
      mockUsersService.findByResetToken.mockResolvedValue(user);

      await expect(
        service.resetPassword('expired', 'NewPass123!'),
      ).rejects.toThrow('Token expirado');
    });

    it('debería rechazar token sin fecha de expiración (Edge Case)', async () => {
      const user = { ...mockUser, resetPasswordExpires: null };
      mockUsersService.findByResetToken.mockResolvedValue(user);

      await expect(
        service.resetPassword('no-expire', 'NewPass123!'),
      ).rejects.toThrow('Token expirado');
    });
  });
});
