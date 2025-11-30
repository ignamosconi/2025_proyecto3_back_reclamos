import { AuthGuard } from './auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockJwtService: any;
  let mockUsersService: any;

  beforeEach(async () => {
    mockJwtService = {
      getPayload: jest.fn(),
    };
    mockUsersService = {
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: 'IJwtService', useValue: mockJwtService },
        { provide: 'IUsersService', useValue: mockUsersService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  it('debería estar definido', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate - Partición de Equivalencia', () => {
    let mockContext: any;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };
      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };
    });

    it('debería permitir acceso con token válido y usuario existente', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';
      mockJwtService.getPayload.mockReturnValue({ email: 'test@test.com' });
      mockUsersService.findByEmail.mockResolvedValue({
        email: 'test@test.com',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toBeDefined();
    });

    it('debería rechazar si falta el header Authorization', async () => {
      mockRequest.headers.authorization = undefined;
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería rechazar si el formato del header es inválido', async () => {
      mockRequest.headers.authorization = 'InvalidFormat token';
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería rechazar si el usuario no existe', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';
      mockJwtService.getPayload.mockReturnValue({ email: 'test@test.com' });
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
