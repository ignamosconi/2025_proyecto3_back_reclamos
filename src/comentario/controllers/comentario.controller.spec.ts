import { Test, TestingModule } from '@nestjs/testing';
import { ComentarioController } from './comentario.controller';
import { ICOMENTARIO_SERVICE } from '../services/interfaces/comentario.service.interface';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

describe('ComentarioController', () => {
  let controller: ComentarioController;
  let mockService: any;

  const mockComentario = {
    texto: 'Test',
    toObject: jest.fn().mockReturnValue({ texto: 'Test' }),
  };

  beforeEach(async () => {
    mockService = {
      create: jest.fn(),
      findByReclamoId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComentarioController],
      providers: [{ provide: ICOMENTARIO_SERVICE, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ComentarioController>(ComentarioController);
  });

  describe('create', () => {
    it('debería llamar al servicio create con los datos del usuario', async () => {
      const mockReq: any = {
        user: { _id: 'user-id', role: 'GERENTE' },
      };
      const dto = { texto: 'Test' };
      mockService.create.mockResolvedValue(mockComentario);

      const result = await controller.create('reclamo-id', dto, mockReq);

      expect(result).toBeDefined();
      expect(mockService.create).toHaveBeenCalledWith(
        'reclamo-id',
        dto,
        'user-id',
        'GERENTE',
      );
    });
  });

  describe('findAll', () => {
    it('debería llamar al servicio findByReclamoId', async () => {
      const mockReq: any = {
        user: { _id: 'user-id', role: 'ENCARGADO' },
      };
      mockService.findByReclamoId.mockResolvedValue([mockComentario]);

      const result = await controller.findAll('reclamo-id', mockReq);

      expect(result).toHaveLength(1);
      expect(mockService.findByReclamoId).toHaveBeenCalledWith(
        'reclamo-id',
        'user-id',
        'ENCARGADO',
      );
    });
  });
});
