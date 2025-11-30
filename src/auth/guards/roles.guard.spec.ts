import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/helpers/enum.roles';
import { Test, TestingModule } from '@nestjs/testing';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let mockReflector: any;

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('debería estar definido', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: any;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        user: { role: UserRole.CLIENTE },
      };
      mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };
    });

    it('debería permitir acceso si no hay roles requeridos', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('debería permitir acceso si el usuario tiene el rol requerido', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.CLIENTE]);
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('debería denegar acceso si el usuario no tiene el rol requerido', () => {
      mockReflector.getAllAndOverride.mockReturnValue([UserRole.GERENTE]);
      expect(guard.canActivate(mockContext)).toBe(false);
    });
  });
});
