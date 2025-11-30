import { Test, TestingModule } from '@nestjs/testing';
import { ComentarioRepository } from './comentario.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Comentario } from '../schemas/comentario.schema';

import { Types } from 'mongoose';

describe('ComentarioRepository', () => {
  let repository: ComentarioRepository;
  let mockModel: any;

  const mockComentario = {
    texto: 'Test',
    save: jest.fn().mockResolvedValue({ texto: 'Test' }),
  };

  beforeEach(async () => {
    mockModel = jest.fn().mockImplementation(() => mockComentario);
    mockModel.find = jest.fn();
    mockModel.countDocuments = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComentarioRepository,
        { provide: getModelToken(Comentario.name), useValue: mockModel },
      ],
    }).compile();

    repository = module.get<ComentarioRepository>(ComentarioRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear un comentario', async () => {
      const autorId = new Types.ObjectId().toString();
      const reclamoId = new Types.ObjectId().toString();
      const result = await repository.create('Test', autorId, reclamoId);
      expect(result).toBeDefined();
      expect(mockComentario.save).toHaveBeenCalled();
    });
  });

  describe('findByReclamoId', () => {
    it('debería buscar y poblar comentarios', async () => {
      const reclamoId = new Types.ObjectId().toString();
      const mockExec = jest.fn().mockResolvedValue([mockComentario]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort });
      mockModel.find.mockReturnValue({ populate: mockPopulate });

      const result = await repository.findByReclamoId(reclamoId);

      expect(result).toHaveLength(1);
      expect(mockModel.find).toHaveBeenCalled();
      expect(mockPopulate).toHaveBeenCalledWith('autor', expect.any(String));
    });
  });

  describe('countByReclamoId', () => {
    it('debería contar documentos', async () => {
      const reclamoId = new Types.ObjectId().toString();
      mockModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });

      const result = await repository.countByReclamoId(reclamoId);
      expect(result).toBe(5);
    });
  });
});
