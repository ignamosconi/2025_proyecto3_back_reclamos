import { Test, TestingModule } from '@nestjs/testing';
import { EncuestaService } from './encuesta.service';
import { IENCUESTA_REPOSITORY } from '../repositories/interfaces/encuesta.repository.interface';
import { IReclamoService } from 'src/reclamo/service/interfaces/reclamo.service.interface';
import { getModelToken } from '@nestjs/mongoose';
import { User } from 'src/users/schemas/user.schema';
import { EstadoReclamo } from 'src/reclamo/enums/estado.enum';
import { UserRole } from 'src/users/helpers/enum.roles';
import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CreateEncuestaDto } from '../dto/create-encuesta.dto';

describe('EncuestaService', () => {
  let service: EncuestaService;
  let repository: any;
  let reclamoService: any;

  const mockRepository = {
    create: jest.fn(),
    findByReclamoAndCliente: jest.fn(),
    findByReclamoId: jest.fn(),
    findAll: jest.fn(),
  };

  const mockReclamoService = {
    findById: jest.fn(),
  };

  const mockUserModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncuestaService,
        { provide: IENCUESTA_REPOSITORY, useValue: mockRepository },
        { provide: 'IReclamoService', useValue: mockReclamoService },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<EncuestaService>(EncuestaService);
    repository = module.get(IENCUESTA_REPOSITORY);
    reclamoService = module.get('IReclamoService');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateEncuestaDto = {
      calificacion: 5,
      descripcion: 'Excelente',
    };
    const clienteId = 'client1';
    const reclamoId = 'reclamo1';

    // Decision Table for Create
    // | State      | Owner? | Exists? | Result |
    // |------------|--------|---------|--------|
    // | RESUELTO   | Yes    | No      | Success|
    // | RECHAZADO  | Yes    | No      | Success|
    // | PENDIENTE  | -      | -       | BadRequest|
    // | RESUELTO   | No     | -       | Forbidden|
    // | RESUELTO   | Yes    | Yes     | Conflict|

    it('should create encuesta if reclamo is RESUELTO, user is owner and no duplicate', async () => {
      mockReclamoService.findById.mockResolvedValue({
        _id: reclamoId,
        estado: EstadoReclamo.RESUELTO,
        fkCliente: { _id: clienteId },
      });
      mockRepository.findByReclamoAndCliente.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        _id: 'encuesta1',
        ...createDto,
      });

      const result = await service.create(createDto, clienteId, reclamoId);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        createDto,
        clienteId,
        reclamoId,
      );
    });

    it('should create encuesta if reclamo is RECHAZADO', async () => {
      mockReclamoService.findById.mockResolvedValue({
        _id: reclamoId,
        estado: EstadoReclamo.RECHAZADO,
        fkCliente: clienteId, // Test string ID handling
      });
      mockRepository.findByReclamoAndCliente.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        _id: 'encuesta1',
        ...createDto,
      });

      await service.create(createDto, clienteId, reclamoId);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if reclamo is not in final state', async () => {
      mockReclamoService.findById.mockResolvedValue({
        _id: reclamoId,
        estado: EstadoReclamo.PENDIENTE,
        fkCliente: { _id: clienteId },
      });

      await expect(
        service.create(createDto, clienteId, reclamoId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockReclamoService.findById.mockResolvedValue({
        _id: reclamoId,
        estado: EstadoReclamo.RESUELTO,
        fkCliente: { _id: 'otherClient' },
      });

      await expect(
        service.create(createDto, clienteId, reclamoId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if encuesta already exists', async () => {
      mockReclamoService.findById.mockResolvedValue({
        _id: reclamoId,
        estado: EstadoReclamo.RESUELTO,
        fkCliente: { _id: clienteId },
      });
      mockRepository.findByReclamoAndCliente.mockResolvedValue({
        _id: 'existing',
      });

      await expect(
        service.create(createDto, clienteId, reclamoId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByReclamoId', () => {
    const reclamoId = 'reclamo1';
    const userId = 'user1';
    const encuestaMock = {
      _id: 'encuesta1',
      fkClienteCreador: { _id: userId },
    };

    it('should return encuesta for owner (CLIENTE)', async () => {
      mockRepository.findByReclamoId.mockResolvedValue(encuestaMock);
      const result = await service.findByReclamoId(
        reclamoId,
        UserRole.CLIENTE,
        userId,
      );
      expect(result).toEqual(encuestaMock);
    });

    it('should return encuesta for ENCARGADO regardless of owner', async () => {
      mockRepository.findByReclamoId.mockResolvedValue(encuestaMock);
      const result = await service.findByReclamoId(
        reclamoId,
        UserRole.ENCARGADO,
        'otherUser',
      );
      expect(result).toEqual(encuestaMock);
    });

    it('should throw ForbiddenException if CLIENTE is not owner', async () => {
      mockRepository.findByReclamoId.mockResolvedValue({
        ...encuestaMock,
        fkClienteCreador: { _id: 'otherUser' },
      });
      await expect(
        service.findByReclamoId(reclamoId, UserRole.CLIENTE, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return null if not found', async () => {
      mockRepository.findByReclamoId.mockResolvedValue(null);
      const result = await service.findByReclamoId(
        reclamoId,
        UserRole.CLIENTE,
        userId,
      );
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all encuestas for ENCARGADO', async () => {
      const mockResult = { data: [], total: 0 };
      mockRepository.findAll.mockResolvedValue(mockResult);
      const result = await service.findAll({}, UserRole.ENCARGADO);
      expect(result).toEqual(mockResult);
    });

    it('should return all encuestas for GERENTE', async () => {
      const mockResult = { data: [], total: 0 };
      mockRepository.findAll.mockResolvedValue(mockResult);
      const result = await service.findAll({}, UserRole.GERENTE);
      expect(result).toEqual(mockResult);
    });

    it('should throw ForbiddenException for CLIENTE', async () => {
      await expect(service.findAll({}, UserRole.CLIENTE)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
