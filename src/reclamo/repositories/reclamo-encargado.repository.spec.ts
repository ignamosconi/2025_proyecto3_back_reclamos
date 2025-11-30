import { Test, TestingModule } from '@nestjs/testing';
import { ReclamoEncargadoRepository } from './reclamo-encargado.repository';
import { getModelToken } from '@nestjs/mongoose';
import { ReclamoEncargado } from '../schemas/reclamo-encargado.schema';

import { Types } from 'mongoose';

describe('ReclamoEncargadoRepository', () => {
  let repository: ReclamoEncargadoRepository;
  let model: any;

  const mockExec = jest.fn();
  const mockPopulate = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();

  class MockModel {
    save: any;
    constructor(public data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
    static deleteOne = jest.fn().mockReturnValue({ exec: mockExec });
    static deleteMany = jest.fn().mockReturnValue({ exec: mockExec });
    static countDocuments = jest.fn().mockReturnValue({ exec: mockExec });
    static find = jest.fn().mockReturnValue({
      select: mockSelect,
      populate: mockPopulate,
      exec: mockExec,
    });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReclamoEncargadoRepository,
        {
          provide: getModelToken(ReclamoEncargado.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<ReclamoEncargadoRepository>(
      ReclamoEncargadoRepository,
    );
    model = module.get(getModelToken(ReclamoEncargado.name));

    jest.clearAllMocks();
    mockPopulate.mockReturnThis();
    mockSelect.mockReturnThis();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('assignEncargado', () => {
    it('should create assignment', async () => {
      const rId = new Types.ObjectId().toString();
      const uId = new Types.ObjectId().toString();
      const result = await repository.assignEncargado(rId, uId);
      expect(result).toBeDefined();
    });
  });

  describe('unassignEncargado', () => {
    it('should delete assignment', async () => {
      const rId = new Types.ObjectId().toString();
      const uId = new Types.ObjectId().toString();
      await repository.unassignEncargado(rId, uId);
      expect(MockModel.deleteOne).toHaveBeenCalled();
    });
  });

  describe('isEncargadoAssigned', () => {
    it('should return true if count > 0', async () => {
      mockExec.mockResolvedValue(1);
      const rId = new Types.ObjectId().toString();
      const uId = new Types.ObjectId().toString();
      const result = await repository.isEncargadoAssigned(rId, uId);
      expect(result).toBe(true);
    });
  });

  describe('findEncargadosByReclamo', () => {
    it('should find and populate', async () => {
      mockExec.mockResolvedValue([]);
      const rId = new Types.ObjectId().toString();
      await repository.findEncargadosByReclamo(rId);
      expect(MockModel.find).toHaveBeenCalled();
      expect(mockPopulate).toHaveBeenCalled();
    });
  });
});
