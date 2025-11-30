import { Test, TestingModule } from '@nestjs/testing';
import { HistorialRepository } from './historial.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Historial } from './schemas/historial.schema';

describe('HistorialRepository', () => {
  let repository: HistorialRepository;
  let model: any;

  const mockExec = jest.fn();
  const mockSort = jest.fn().mockReturnThis();
  const mockPopulate = jest.fn().mockReturnThis();

  // Mock constructor for new Model(data)
  class MockModel {
    save: any;
    constructor(public data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
    static find = jest.fn().mockReturnValue({
      sort: mockSort,
      populate: mockPopulate,
      exec: mockExec,
    });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistorialRepository,
        {
          provide: getModelToken(Historial.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<HistorialRepository>(HistorialRepository);
    model = module.get(getModelToken(Historial.name));
    jest.clearAllMocks();

    // Reset chain mocks
    mockSort.mockReturnThis();
    mockPopulate.mockReturnThis();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new historial entry', async () => {
      const data = { accion: 'test', detalle: 'test detail' };
      const result = await repository.create(data);

      expect(result).toEqual(data);
    });
  });

  describe('findByReclamoId', () => {
    it('should find entries by reclamoId, sort by date desc, and populate responsible', async () => {
      const reclamoId = 'r1';
      const expectedResult = [{ _id: 'h1' }];
      mockExec.mockResolvedValue(expectedResult);

      const result = await repository.findByReclamoId(reclamoId);

      expect(MockModel.find).toHaveBeenCalledWith({ reclamoId });
      expect(mockSort).toHaveBeenCalledWith({ fecha_hora: -1 });
      expect(mockPopulate).toHaveBeenCalledWith(
        'responsable',
        'nombre apellido email',
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
