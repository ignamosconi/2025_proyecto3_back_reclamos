import { Test, TestingModule } from '@nestjs/testing';
import { EncuestaRepository } from './encuesta.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Encuesta } from '../schemas/encuesta.schema';
import { CreateEncuestaDto } from '../dto/create-encuesta.dto';

describe('EncuestaRepository', () => {
  let repository: EncuestaRepository;
  let model: any;

  const mockExec = jest.fn();
  const mockSort = jest.fn().mockReturnThis();
  const mockSkip = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockPopulate = jest.fn().mockReturnThis();

  const mockModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncuestaRepository,
        {
          provide: getModelToken(Encuesta.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<EncuestaRepository>(EncuestaRepository);
    model = module.get(getModelToken(Encuesta.name));

    jest.clearAllMocks();
    mockModel.findOne.mockReturnValue({ exec: mockExec });
    mockModel.findById.mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
    });
    mockModel.find.mockReturnValue({
      sort: mockSort,
      skip: mockSkip,
      limit: mockLimit,
      populate: mockPopulate,
      exec: mockExec,
    });
    // Reset chain mocks
    mockPopulate.mockReturnThis();
    mockSort.mockReturnThis();
    mockSkip.mockReturnThis();
    mockLimit.mockReturnThis();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new encuesta', async () => {
      const dto: CreateEncuestaDto = { calificacion: 5, descripcion: 'Test' };
      const clienteId = 'client1';
      const reclamoId = 'reclamo1';
      const expectedData = {
        ...dto,
        fkReclamo: reclamoId,
        fkClienteCreador: clienteId,
      };

      mockModel.create.mockResolvedValue(expectedData);

      const result = await repository.create(dto, clienteId, reclamoId);

      expect(mockModel.create).toHaveBeenCalledWith(expectedData);
      expect(result).toEqual(expectedData);
    });
  });

  describe('findByReclamoId', () => {
    it('should find one by reclamoId', async () => {
      const reclamoId = 'r1';
      mockExec.mockResolvedValue({ _id: 'e1' });

      await repository.findByReclamoId(reclamoId);

      expect(mockModel.findOne).toHaveBeenCalledWith({ fkReclamo: reclamoId });
      expect(mockExec).toHaveBeenCalled();
    });
  });

  describe('findByReclamoAndCliente', () => {
    it('should find one by reclamoId and clienteId', async () => {
      const reclamoId = 'r1';
      const clienteId = 'c1';
      mockExec.mockResolvedValue({ _id: 'e1' });

      await repository.findByReclamoAndCliente(reclamoId, clienteId);

      expect(mockModel.findOne).toHaveBeenCalledWith({
        fkReclamo: reclamoId,
        fkClienteCreador: clienteId,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query = { page: 1, limit: 10 };
      const mockEncuestas = [
        {
          toObject: () => ({
            _id: 'e1',
            calificacion: 5,
            descripcion: 'desc',
            fkReclamo: 'r1',
            fkClienteCreador: 'c1',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      ];

      mockModel.countDocuments.mockResolvedValue(1);
      mockExec.mockResolvedValue(mockEncuestas);

      const result = await repository.findAll(query);

      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockSort).toHaveBeenCalledWith({ createdAt: 1 });
    });
  });

  describe('findById', () => {
    it('should find by id and populate', async () => {
      const id = 'e1';
      mockExec.mockResolvedValue({ _id: id });

      await repository.findById(id);

      expect(mockModel.findById).toHaveBeenCalledWith(id);
      expect(mockPopulate).toHaveBeenCalledWith('fkReclamo');
      expect(mockPopulate).toHaveBeenCalledWith('fkClienteCreador');
    });
  });

  describe('findRawById', () => {
    it('should find by id without populate', async () => {
      const id = 'e1';

      mockExec.mockResolvedValue({ _id: id });

      await repository.findRawById(id);

      expect(mockModel.findById).toHaveBeenCalledWith(id);
    });
  });
});
