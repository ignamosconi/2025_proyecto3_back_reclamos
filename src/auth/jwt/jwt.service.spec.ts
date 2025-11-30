import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JwtService', () => {
  let service: JwtService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key) => {
        switch (key) {
          case 'JWT_ACCESS_SECRET':
            return 'access-secret';
          case 'JWT_ACCESS_EXPIRATION':
            return '15m';
          case 'JWT_REFRESH_SECRET':
            return 'refresh-secret';
          case 'JWT_REFRESH_EXPIRATION':
            return '7d';
          default:
            return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('debería lanzar error si faltan variables de entorno', () => {
      mockConfigService.get.mockReturnValue(null);
      expect(() => new JwtService(mockConfigService)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('generateToken', () => {
    it('debería generar un token de acceso por defecto', () => {
      (jwt.sign as jest.Mock).mockReturnValue('signed-token');
      const token = service.generateToken({
        email: 'test@test.com',
        role: 'Cliente',
      });
      expect(token).toBe('signed-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        'access-secret',
        expect.objectContaining({ expiresIn: '15m' }),
      );
    });

    it('debería generar un token de refresh si se solicita', () => {
      (jwt.sign as jest.Mock).mockReturnValue('signed-refresh-token');
      const token = service.generateToken(
        { email: 'test@test.com', role: 'Cliente' },
        'refresh',
      );
      expect(token).toBe('signed-refresh-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.anything(),
        'refresh-secret',
        expect.objectContaining({ expiresIn: '7d' }),
      );
    });
  });

  describe('refreshToken - Lógica de Renovación', () => {
    // Casos:
    // 1. Token válido, lejos de expirar -> Solo devuelve AccessToken
    // 2. Token válido, cerca de expirar (<20 min) -> Devuelve AccessToken + Nuevo RefreshToken
    // 3. Token inválido/expirado -> UnauthorizedException

    it('debería devolver solo accessToken si el refresh no está por expirar', () => {
      const payload = {
        email: 'test@test.com',
        role: 'Cliente',
        exp: Math.floor(Date.now() / 1000) + 3600, // Expira en 1 hora (> 20 min)
      };
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (jwt.sign as jest.Mock).mockReturnValue('new-access-token');

      const result = service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('debería devolver accessToken y refreshToken si está por expirar (< 20 min)', () => {
      const payload = {
        email: 'test@test.com',
        role: 'Cliente',
        exp: Math.floor(Date.now() / 1000) + 600, // Expira en 10 min (< 20 min)
      };
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (jwt.sign as jest.Mock).mockReturnValue('new-token');

      const result = service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('debería lanzar UnauthorizedException si jwt.verify falla', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.refreshToken('invalid-token')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getPayload', () => {
    it('debería devolver el payload si es válido', () => {
      const payload = { email: 'test@test.com', role: 'Cliente' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = service.getPayload('valid-token');
      expect(result).toEqual(payload);
    });

    it('debería lanzar UnauthorizedException si el payload no tiene email', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ role: 'Cliente' }); // Falta email
      expect(() => service.getPayload('invalid-payload')).toThrow(
        UnauthorizedException,
      );
    });
  });
});
