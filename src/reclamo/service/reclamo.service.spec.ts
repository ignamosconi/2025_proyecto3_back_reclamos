import { Test, TestingModule } from '@nestjs/testing';
import { ReclamoService } from './reclamo.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/user.schema';
import { EstadoReclamo } from '../enums/estado.enum';
import { UserRole } from '../../users/helpers/enum.roles';
import { ISINTESIS_SERVICE } from 'src/sintesis/services/interfaces/sintesis.service.interface';
import { ConfigService } from '@nestjs/config';
import { HistorialService } from 'src/historial/historial.service';
import { IImagenRepository } from '../repositories/interfaces/imagen.repository.interface';

describe('ReclamoService', () => {
  let service: ReclamoService;
  let mockReclamoRepository: any;
  let mockReclamoEncargadoRepository: any;
  let mockProyectosService: any;
  let mockUserModel: any;
  let mockImagenRepository: any;
  let mockHistorialService: any;
  let mockMailerService: any;
  let mockConfigService: any;
  let mockSintesisService: any;

  const mockUser = {
    _id: 'user-id-123',
    email: 'client@example.com',
    role: UserRole.CLIENTE,
  };

  const mockReclamo = {
    _id: 'reclamo-id-123',
    titulo: 'Test Reclamo',
    estado: EstadoReclamo.PENDIENTE,
    fkCliente: 'user-id-123',
    fkProyecto: 'proyecto-id-123',
    fkArea: 'area-id-123',
    deletedAt: null,
    toObject: jest.fn().mockReturnValue({
      _id: 'reclamo-id-123',
      titulo: 'Test Reclamo',
      estado: EstadoReclamo.PENDIENTE,
      fkCliente: 'user-id-123',
    }),
  };

  beforeEach(async () => {
    mockReclamoRepository = {
      create: jest.fn(),
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findDeleted: jest.fn(),
      clearEncargados: jest.fn(),
      updateArea: jest.fn(),
      updateEstado: jest.fn(),
    };

    mockReclamoEncargadoRepository = {
      isEncargadoAssigned: jest.fn(),
      findEncargadosByReclamo: jest.fn(),
    };

    mockProyectosService = {
      findById: jest.fn(),
    };

    mockUserModel = {
      exists: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    mockImagenRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
    };

    mockHistorialService = {
      create: jest.fn(),
    };

    mockMailerService = {
      sendMail: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    mockSintesisService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReclamoService,
        { provide: 'IReclamoRepository', useValue: mockReclamoRepository },
        {
          provide: 'IReclamoEncargadoRepository',
          useValue: mockReclamoEncargadoRepository,
        },
        { provide: 'IProyectosService', useValue: mockProyectosService },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: IImagenRepository, useValue: mockImagenRepository },
        { provide: HistorialService, useValue: mockHistorialService },
        { provide: 'IMailerService', useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ISINTESIS_SERVICE, useValue: mockSintesisService },
      ],
    }).compile();

    service = module.get<ReclamoService>(ReclamoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      titulo: 'Falla en ascensor',
      descripcion: 'No abre la puerta',
      fkProyecto: 'proyecto-id-123',
      fkTipoReclamo: 'tipo-id-123',
    };

    it('debería crear un reclamo exitosamente', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockProyectosService.findById.mockResolvedValue({
        _id: 'proyecto-id-123',
        areaResponsable: 'area-id-123',
      });
      mockReclamoRepository.create.mockResolvedValue(mockReclamo);
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.create(createDto, 'user-id-123');

      expect(result).toBeDefined();
      expect(mockReclamoRepository.create).toHaveBeenCalled();
      expect(mockHistorialService.create).toHaveBeenCalled();
    });

    it('debería fallar si el usuario no existe', async () => {
      mockUserModel.exists.mockResolvedValue(false);

      await expect(service.create(createDto, 'user-id-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería fallar si el proyecto no tiene área responsable', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockProyectosService.findById.mockResolvedValue({
        _id: 'proyecto-id-123',
        areaResponsable: null,
      });

      await expect(service.create(createDto, 'user-id-123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('changeState', () => {
    const changeStateDto = {
      estado: EstadoReclamo.EN_REVISION,
    };

    it('debería cambiar el estado correctamente (Transición Válida)', async () => {
      mockReclamoRepository.findById.mockResolvedValue(mockReclamo);
      mockReclamoRepository.updateEstado.mockResolvedValue({
        ...mockReclamo,
        estado: EstadoReclamo.EN_REVISION,
      });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        true,
      );
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            areas: [{ _id: 'area-id-123' }],
          }),
        }),
      });

      const result = await service.changeState(
        'reclamo-id-123',
        changeStateDto,
        'staff-id-123',
        UserRole.ENCARGADO,
      );

      expect(result.estado).toBe(EstadoReclamo.EN_REVISION);
      expect(mockReclamoRepository.updateEstado).toHaveBeenCalledWith(
        'reclamo-id-123',
        EstadoReclamo.EN_REVISION,
      );
    });

    it('debería fallar con transición inválida', async () => {
      mockReclamoRepository.findById.mockResolvedValue(mockReclamo); // Estado PENDIENTE

      const invalidDto = { estado: EstadoReclamo.RESUELTO }; // PENDIENTE -> RESUELTO no es directo (requiere EN_REVISION)

      await expect(
        service.changeState(
          'reclamo-id-123',
          invalidDto,
          'staff-id-123',
          UserRole.GERENTE,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería fallar si falta síntesis para estado final', async () => {
      mockReclamoRepository.findById.mockResolvedValue({
        ...mockReclamo,
        estado: EstadoReclamo.EN_REVISION,
      });

      const finalDto = { estado: EstadoReclamo.RESUELTO }; // Falta sintesis

      await expect(
        service.changeState(
          'reclamo-id-123',
          finalDto,
          'staff-id-123',
          UserRole.GERENTE,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reassignArea', () => {
    it('debería reasignar área y resetear estado', async () => {
      mockReclamoRepository.updateArea.mockResolvedValue({
        ...mockReclamo,
        fkArea: 'new-area-id',
      });

      const result = await service.reassignArea(
        'reclamo-id-123',
        'new-area-id',
      );

      expect(mockReclamoRepository.clearEncargados).toHaveBeenCalledWith(
        'reclamo-id-123',
      );
      expect(mockReclamoRepository.updateArea).toHaveBeenCalledWith(
        'reclamo-id-123',
        'new-area-id',
      );
      expect(result).toBeDefined();
    });
  });
});
