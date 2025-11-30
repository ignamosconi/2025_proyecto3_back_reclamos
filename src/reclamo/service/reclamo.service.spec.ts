import { Test, TestingModule } from '@nestjs/testing';
import { ReclamoService } from './reclamo.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/user.schema';
import { HistorialService } from '../../historial/historial.service';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EstadoReclamo } from '../enums/estado.enum';
import { Types } from 'mongoose';
import { ISINTESIS_SERVICE } from '../../sintesis/services/interfaces/sintesis.service.interface';
import { IImagenRepository } from '../repositories/interfaces/imagen.repository.interface';

describe('ReclamoService', () => {
  let service: ReclamoService;
  let mockReclamoRepository: any;
  let mockReclamoEncargadoRepository: any;
  let mockProyectosService: any;
  let mockProyectosRepository: any;
  let mockUserModel: any;
  let mockImagenRepository: any;
  let mockHistorialService: any;
  let mockMailerService: any;
  let mockConfigService: any;
  let mockSintesisService: any;

  const mockReclamo = {
    _id: 'reclamo-id',
    titulo: 'Test Reclamo',
    estado: EstadoReclamo.PENDIENTE,
    fkCliente: 'user-id',
    fkArea: 'area-id',
    fkProyecto: 'proyecto-id',
    deletedAt: null,
  };

  beforeEach(async () => {
    mockReclamoRepository = {
      create: jest.fn(),
      findAllPaginated: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      updateEstado: jest.fn(),
      findDeleted: jest.fn(),
    };

    mockReclamoEncargadoRepository = {
      isEncargadoAssigned: jest.fn(),
      findEncargadosByReclamo: jest.fn(),
    };

    mockProyectosService = {};
    mockProyectosRepository = {
      findById: jest.fn(),
    };

    mockUserModel = {
      exists: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
    };

    mockImagenRepository = {
      create: jest.fn(),
    };

    mockHistorialService = {
      create: jest.fn(),
    };

    mockMailerService = {
      sendMail: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(),
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
        { provide: 'IProyectosRepository', useValue: mockProyectosRepository },
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
      titulo: 'Test',
      descripcion: 'Desc',
      fkProyecto: new Types.ObjectId().toString(),
      fkTipoReclamo: new Types.ObjectId().toString(),
      prioridad: 'Alta',
    } as any;
    const userId = new Types.ObjectId().toString();

    it('should create reclamo successfully', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockProyectosRepository.findById.mockResolvedValue({
        _id: createDto.fkProyecto,
        cliente: userId,
        areaResponsable: new Types.ObjectId().toString(),
      });
      mockReclamoRepository.create.mockResolvedValue(mockReclamo);
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.create(createDto, userId);

      expect(result).toEqual(mockReclamo);
      expect(mockReclamoRepository.create).toHaveBeenCalled();
      expect(mockHistorialService.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserModel.exists.mockResolvedValue(false);
      await expect(service.create(createDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if project does not belong to user', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockProyectosRepository.findById.mockResolvedValue({
        _id: createDto.fkProyecto,
        cliente: new Types.ObjectId().toString(),
        areaResponsable: new Types.ObjectId().toString(),
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if project has no area', async () => {
      mockUserModel.exists.mockResolvedValue(true);
      mockProyectosRepository.findById.mockResolvedValue({
        _id: createDto.fkProyecto,
        cliente: userId,
        areaResponsable: null,
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll (RBAC)', () => {
    const query = { page: 1, limit: 10 };

    it('CLIENTE: should filter by userId', async () => {
      const clientId = new Types.ObjectId().toString();
      mockReclamoRepository.findAllPaginated.mockResolvedValue({
        data: [],
        total: 0,
      });
      await service.findAll(query, clientId, 'Cliente');
      expect(mockReclamoRepository.findAllPaginated).toHaveBeenCalledWith(
        query,
        clientId,
        undefined,
      );
    });

    it('ENCARGADO: should filter by assigned areas', async () => {
      const encargadoId = new Types.ObjectId().toString();
      const areaId = new Types.ObjectId().toString();
      const areas = [{ _id: areaId }];
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ areas }),
        }),
      });
      mockReclamoRepository.findAllPaginated.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findAll(query, encargadoId, 'ENCARGADO');
      expect(mockReclamoRepository.findAllPaginated).toHaveBeenCalledWith(
        query,
        undefined,
        [areaId],
      );
    });
  });

  describe('findById (RBAC)', () => {
    it('CLIENTE: should return reclamo if owner', async () => {
      const userId = new Types.ObjectId().toString();
      const reclamoId = new Types.ObjectId().toString();
      const mockReclamoWithOwner = {
        ...mockReclamo,
        fkCliente: userId,
      };
      mockReclamoRepository.findById.mockResolvedValue(mockReclamoWithOwner);
      const result = await service.findById(reclamoId, userId, 'CLIENTE');
      expect(result).toEqual(mockReclamoWithOwner);
    });

    it('CLIENTE: should throw Forbidden if not owner', async () => {
      const userId = new Types.ObjectId().toString();
      const otherUser = new Types.ObjectId().toString();
      const reclamoId = new Types.ObjectId().toString();
      mockReclamoRepository.findById.mockResolvedValue({
        ...mockReclamo,
        fkCliente: otherUser,
      });
      await expect(
        service.findById(reclamoId, userId, 'CLIENTE'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ENCARGADO: should return reclamo if area matches', async () => {
      const encargadoId = new Types.ObjectId().toString();
      const areaId = new Types.ObjectId().toString();
      const reclamoId = new Types.ObjectId().toString();
      const areas = [{ _id: areaId }];

      const mockReclamoWithArea = {
        ...mockReclamo,
        fkArea: areaId,
      };

      mockReclamoRepository.findById.mockResolvedValue(mockReclamoWithArea);
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ areas }),
        }),
      });

      const result = await service.findById(
        reclamoId,
        encargadoId,
        'ENCARGADO',
      );
      expect(result).toEqual(mockReclamoWithArea);
    });
  });

  describe('changeState', () => {
    const changeStateDto = { estado: EstadoReclamo.RESUELTO, sintesis: 'Done' };
    const actorId = new Types.ObjectId().toString();
    const reclamoId = new Types.ObjectId().toString();
    const areaId = new Types.ObjectId().toString();

    it('should change state successfully', async () => {
      mockReclamoRepository.findById.mockResolvedValue({
        ...mockReclamo,
        estado: EstadoReclamo.EN_REVISION,
        fkArea: { _id: areaId },
      });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        true,
      );
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ areas: [{ _id: areaId }] }),
        }),
      });
      mockReclamoRepository.updateEstado.mockResolvedValue(true);
      mockReclamoEncargadoRepository.findEncargadosByReclamo.mockResolvedValue(
        [],
      );

      const result = await service.changeState(
        reclamoId,
        changeStateDto as any,
        actorId,
        'ENCARGADO',
      );
      expect(result).toBe(true);
      expect(mockSintesisService.create).toHaveBeenCalled();
    });

    it('should throw BadRequest if transition is invalid', async () => {
      mockReclamoRepository.findById.mockResolvedValue(mockReclamo); // PENDIENTE
      // PENDIENTE -> RESUELTO is invalid (must go through EN_REVISION)

      await expect(
        service.changeState(
          reclamoId,
          changeStateDto as any,
          actorId,
          'ENCARGADO',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw Forbidden if encargado not assigned', async () => {
      mockReclamoRepository.findById.mockResolvedValue({
        ...mockReclamo,
        estado: EstadoReclamo.EN_REVISION,
      });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        false,
      );

      await expect(
        service.changeState(
          reclamoId,
          changeStateDto as any,
          actorId,
          'ENCARGADO',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
