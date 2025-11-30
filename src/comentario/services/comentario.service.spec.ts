import { Test, TestingModule } from '@nestjs/testing';
import { ComentarioService } from './comentario.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from 'src/users/schemas/user.schema';
import { HistorialService } from 'src/historial/historial.service';
import { ICOMENTARIO_REPOSITORY } from '../repositories/interfaces/comentario.repository.interface';

describe('ComentarioService', () => {
  let service: ComentarioService;
  let mockComentarioRepository: any;
  let mockReclamoRepository: any;
  let mockReclamoEncargadoRepository: any;
  let mockUserModel: any;
  let mockHistorialService: any;

  const mockComentario = {
    _id: 'comentario-id-123',
    texto: 'Test comment',
    populate: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    mockComentarioRepository = {
      create: jest.fn(),
      findByReclamoId: jest.fn(),
    };

    mockReclamoRepository = {
      findById: jest.fn(),
    };

    mockReclamoEncargadoRepository = {
      isEncargadoAssigned: jest.fn(),
    };

    mockHistorialService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComentarioService,
        { provide: ICOMENTARIO_REPOSITORY, useValue: mockComentarioRepository },
        { provide: 'IReclamoRepository', useValue: mockReclamoRepository },
        {
          provide: 'IReclamoEncargadoRepository',
          useValue: mockReclamoEncargadoRepository,
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: HistorialService, useValue: mockHistorialService },
      ],
    }).compile();

    service = module.get<ComentarioService>(ComentarioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Tabla de Decisión (Permisos)', () => {
    // Tabla de Decisión para Permisos:
    // | Rol       | Asignado? | Resultado Esperado |
    // |-----------|-----------|--------------------|
    // | GERENTE   | N/A       | Éxito              |
    // | ENCARGADO | Sí        | Éxito              |
    // | ENCARGADO | No        | ForbiddenException |
    // | CLIENTE   | N/A       | ForbiddenException |

    const testCases = [
      {
        desc: 'Gerente puede comentar siempre',
        role: 'GERENTE',
        assigned: false,
        expectedError: null,
      },
      {
        desc: 'Encargado asignado puede comentar',
        role: 'ENCARGADO',
        assigned: true,
        expectedError: null,
      },
      {
        desc: 'Encargado NO asignado NO puede comentar',
        role: 'ENCARGADO',
        assigned: false,
        expectedError: ForbiddenException,
      },
      {
        desc: 'Cliente NO puede comentar',
        role: 'CLIENTE',
        assigned: false,
        expectedError: ForbiddenException,
      },
    ];

    test.each(testCases)('$desc', async ({ role, assigned, expectedError }) => {
      mockReclamoRepository.findById.mockResolvedValue({ _id: 'reclamo-id' });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        assigned,
      );
      mockComentarioRepository.create.mockResolvedValue(mockComentario);

      const dto = { texto: 'Test' };
      const call = () => service.create('reclamo-id', dto, 'user-id', role);

      if (expectedError) {
        await expect(call()).rejects.toThrow(expectedError);
      } else {
        const result = await call();
        expect(result).toBeDefined();
        expect(mockComentarioRepository.create).toHaveBeenCalled();
        expect(mockHistorialService.create).toHaveBeenCalled();
      }
    });

    it('debería fallar si el reclamo no existe', async () => {
      mockReclamoRepository.findById.mockResolvedValue(null);
      await expect(
        service.create('reclamo-id', { texto: 'Test' }, 'user-id', 'GERENTE'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create - Truncamiento de Historial (Partición de Equivalencia)', () => {
    it('debería truncar el texto en el historial si es mayor a 200 caracteres', async () => {
      mockReclamoRepository.findById.mockResolvedValue({ _id: 'reclamo-id' });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        true,
      );
      mockComentarioRepository.create.mockResolvedValue(mockComentario);

      const longText = 'a'.repeat(205);
      const dto = { texto: longText };

      await service.create('reclamo-id', dto, 'user-id', 'ENCARGADO');

      const expectedTruncated = 'a'.repeat(200) + '...';
      expect(mockHistorialService.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.stringContaining(expectedTruncated), // Verify truncation
        expect.anything(),
        expect.anything(),
      );
    });

    it('NO debería truncar el texto en el historial si es menor o igual a 200 caracteres', async () => {
      mockReclamoRepository.findById.mockResolvedValue({ _id: 'reclamo-id' });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        true,
      );
      mockComentarioRepository.create.mockResolvedValue(mockComentario);

      const shortText = 'Short message';
      const dto = { texto: shortText };

      await service.create('reclamo-id', dto, 'user-id', 'ENCARGADO');

      expect(mockHistorialService.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.stringContaining(`"${shortText}"`), // Verify full text
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('findByReclamoId', () => {
    it('debería retornar comentarios si tiene permiso', async () => {
      mockReclamoRepository.findById.mockResolvedValue({ _id: 'reclamo-id' });
      mockComentarioRepository.findByReclamoId.mockResolvedValue([
        mockComentario,
      ]);

      const result = await service.findByReclamoId(
        'reclamo-id',
        'user-id',
        'GERENTE',
      );
      expect(result).toHaveLength(1);
    });

    it('debería fallar si no tiene permiso', async () => {
      mockReclamoRepository.findById.mockResolvedValue({ _id: 'reclamo-id' });
      mockReclamoEncargadoRepository.isEncargadoAssigned.mockResolvedValue(
        false,
      );

      await expect(
        service.findByReclamoId('reclamo-id', 'user-id', 'ENCARGADO'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debería fallar si el reclamo no existe', async () => {
      mockReclamoRepository.findById.mockResolvedValue(null);
      await expect(
        service.findByReclamoId('non-existent', 'user-id', 'GERENTE'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
