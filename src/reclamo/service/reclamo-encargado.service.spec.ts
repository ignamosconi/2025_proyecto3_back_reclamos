import { Test, TestingModule } from '@nestjs/testing';
import { ReclamoEncargadoService } from './reclamo-encargado.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/user.schema';
import { HistorialService } from '../../historial/historial.service';
import { BadRequestException } from '@nestjs/common';
import { EstadoReclamo } from '../enums/estado.enum';

describe('ReclamoEncargadoService', () => {
  let service: ReclamoEncargadoService;
  let mockReclamoRepository: any;
  let mockReclamoEncargadoRepository: any;
  let mockUserModel: any;
  let mockHistorialService: any;

  beforeEach(async () => {
    mockReclamoRepository = {
      findById: jest.fn(),
      updateEstadoToEnRevision: jest.fn(),
      updateEstado: jest.fn(),
    };

    mockReclamoEncargadoRepository = {
      isEncargadoAssigned: jest.fn(),
      assignEncargado: jest.fn(),
      unassignEncargado: jest.fn(),
      countEncargadosByReclamo: jest.fn(),
      findEncargadosByReclamo: jest.fn(),
    };

    mockUserModel = {
      findById: jest.fn(),
    };

    mockHistorialService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReclamoEncargadoService,
        { provide: 'IReclamoRepository', useValue: mockReclamoRepository },
        {
          provide: 'IReclamoEncargadoRepository',
          useValue: mockReclamoEncargadoRepository,
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: HistorialService, useValue: mockHistorialService },
      ],
    }).compile();

    service = module.get<ReclamoEncargadoService>(ReclamoEncargadoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('autoAssign', () => {
    it('should auto assign successfully', async () => {
      mockReclamoRepository.findById.mockResolvedValue({
        _id: 'r1',
        estado: EstadoReclamo.PENDIENTE,
      });
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'u1' }),
      });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        false,
      );
      mockReclamoRepository.updateEstadoToEnRevision.mockResolvedValue(true);

      await service.autoAssign('r1', 'u1');

      expect(
        mockReclamoEncargadoRepository.assignEncargado,
      ).toHaveBeenCalledWith('r1', 'u1');
      expect(mockHistorialService.create).toHaveBeenCalledTimes(2); // Assign + State Change
    });

    it('should fail if reclamo not PENDIENTE', async () => {
      mockReclamoRepository.findById.mockResolvedValue({
        _id: 'r1',
        estado: EstadoReclamo.EN_REVISION,
      });

      await expect(service.autoAssign('r1', 'u1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateTeam', () => {
    it('should add and remove encargados', async () => {
      mockReclamoRepository.findById.mockResolvedValue({
        _id: 'r1',
        estado: EstadoReclamo.PENDIENTE,
      });
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'u1' }),
      });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        false,
      );
      mockReclamoEncargadoRepository.countEncargadosByReclamo.mockResolvedValue(
        1,
      );

      const updateDto = {
        addEncargadosIds: ['u1'],
        removeEncargadosIds: ['u2'],
      };

      await service.updateTeam('r1', 'admin', updateDto);

      expect(
        mockReclamoEncargadoRepository.unassignEncargado,
      ).toHaveBeenCalledWith('r1', 'u2');
      expect(
        mockReclamoEncargadoRepository.assignEncargado,
      ).toHaveBeenCalledWith('r1', 'u1');
      expect(mockReclamoRepository.updateEstadoToEnRevision).toHaveBeenCalled();
    });
  });
});
