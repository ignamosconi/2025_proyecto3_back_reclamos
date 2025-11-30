import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      tokens: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('debería llamar al servicio login', async () => {
      const dto = { email: 'test@test.com', password: 'pass' };
      await controller.login(dto);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('forgotPassword', () => {
    it('debería llamar al servicio forgotPassword', async () => {
      const dto = { email: 'test@test.com' };
      await controller.forgotPassword(dto);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto.email);
    });
  });
});
