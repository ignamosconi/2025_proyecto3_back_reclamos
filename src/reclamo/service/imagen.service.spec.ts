import { Test, TestingModule } from '@nestjs/testing';
import { ImagenService } from './imagen.service';
import { IImagenRepository } from '../repositories/interfaces/imagen.repository.interface';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EstadoReclamo } from '../enums/estado.enum';
import { Types } from 'mongoose';

describe('ImagenService', () => {
  let service: ImagenService;
  let imagenRepository: any;
  let reclamoRepository: any;

  const mockReclamoId = new Types.ObjectId().toString();
  const mockActorId = new Types.ObjectId().toString();
  const mockOtherActorId = new Types.ObjectId().toString();
  const mockImagenId = new Types.ObjectId().toString();

  const mockReclamo = {
    _id: mockReclamoId,
    fkCliente: mockActorId,
    estado: EstadoReclamo.PENDIENTE,
  };

  const mockImagen = {
    _id: mockImagenId,
    nombre: 'test.png',
    tipo: 'image/png',
    imagen: Buffer.from('test'),
    fkReclamo: mockReclamoId,
  };

  beforeEach(async () => {
    imagenRepository = {
      create: jest.fn(),
      updateById: jest.fn(),
      findByReclamo: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
    };

    reclamoRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagenService,
        { provide: IImagenRepository, useValue: imagenRepository },
        { provide: 'IReclamoRepository', useValue: reclamoRepository },
      ],
    }).compile();

    service = module.get<ImagenService>(ImagenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      nombre: 'test.png',
      tipo: 'image/png',
      imagen: 'base64string',
    };

    it('should create an image successfully', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);
      imagenRepository.create.mockResolvedValue(mockImagen);

      const result = await service.create(
        mockReclamoId,
        createDto,
        mockActorId,
      );

      expect(result).toEqual(mockImagen);
      expect(reclamoRepository.findById).toHaveBeenCalledWith(
        mockReclamoId,
        false,
      );
      expect(imagenRepository.create).toHaveBeenCalledWith(
        createDto.nombre,
        createDto.tipo,
        expect.any(Buffer),
        mockReclamoId,
      );
    });

    it('should throw NotFoundException if reclamo not found', async () => {
      reclamoRepository.findById.mockResolvedValue(null);

      await expect(
        service.create(mockReclamoId, createDto, mockActorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if actor is not the owner', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);

      await expect(
        service.create(mockReclamoId, createDto, mockOtherActorId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if reclamo is not PENDIENTE', async () => {
      reclamoRepository.findById.mockResolvedValue({
        ...mockReclamo,
        estado: EstadoReclamo.EN_REVISION,
      });

      await expect(
        service.create(mockReclamoId, createDto, mockActorId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle reclamo.fkCliente as object with _id', async () => {
      reclamoRepository.findById.mockResolvedValue({
        ...mockReclamo,
        fkCliente: { _id: mockActorId },
      });
      imagenRepository.create.mockResolvedValue(mockImagen);

      const result = await service.create(
        mockReclamoId,
        createDto,
        mockActorId,
      );

      expect(result).toEqual(mockImagen);
    });
  });

  describe('update', () => {
    const updateDto = {
      nombre: 'updated.png',
      tipo: 'image/png',
      imagen: 'updatedbase64',
    };

    it('should update an image successfully', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);
      imagenRepository.findById.mockResolvedValue(mockImagen);
      imagenRepository.updateById.mockResolvedValue({
        ...mockImagen,
        ...updateDto,
      });

      const result = await service.update(
        mockReclamoId,
        mockImagenId,
        updateDto,
        mockActorId,
      );

      expect(result.nombre).toBe(updateDto.nombre);
      expect(imagenRepository.updateById).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reclamo not found', async () => {
      reclamoRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(mockReclamoId, mockImagenId, updateDto, mockActorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if actor is not the owner', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);

      await expect(
        service.update(
          mockReclamoId,
          mockImagenId,
          updateDto,
          mockOtherActorId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if reclamo is not PENDIENTE', async () => {
      reclamoRepository.findById.mockResolvedValue({
        ...mockReclamo,
        estado: EstadoReclamo.RESUELTO,
      });

      await expect(
        service.update(mockReclamoId, mockImagenId, updateDto, mockActorId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if imagen not found', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);
      imagenRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(mockReclamoId, mockImagenId, updateDto, mockActorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if imagen does not belong to reclamo', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);
      imagenRepository.findById.mockResolvedValue({
        ...mockImagen,
        fkReclamo: new Types.ObjectId().toString(),
      });

      await expect(
        service.update(mockReclamoId, mockImagenId, updateDto, mockActorId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if update fails', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);
      imagenRepository.findById.mockResolvedValue(mockImagen);
      imagenRepository.updateById.mockResolvedValue(null);

      await expect(
        service.update(mockReclamoId, mockImagenId, updateDto, mockActorId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByReclamo', () => {
    it('should return images for a reclamo', async () => {
      imagenRepository.findByReclamo.mockResolvedValue([mockImagen]);

      const result = await service.findByReclamo(mockReclamoId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockImagen);
      expect(imagenRepository.findByReclamo).toHaveBeenCalledWith(
        mockReclamoId,
      );
    });
  });

  describe('findById', () => {
    it('should return an image by id', async () => {
      imagenRepository.findById.mockResolvedValue(mockImagen);

      const result = await service.findById(mockImagenId);

      expect(result).toEqual(mockImagen);
      expect(imagenRepository.findById).toHaveBeenCalledWith(mockImagenId);
    });
  });

  describe('deleteById', () => {
    it('should delete an image successfully', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);
      imagenRepository.findById.mockResolvedValue(mockImagen);
      imagenRepository.deleteById.mockResolvedValue(true);

      await service.deleteById(mockImagenId, mockReclamoId, mockActorId);

      expect(imagenRepository.deleteById).toHaveBeenCalledWith(mockImagenId);
    });

    it('should throw NotFoundException if reclamo not found', async () => {
      reclamoRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteById(mockImagenId, mockReclamoId, mockActorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if actor is not the owner', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);

      await expect(
        service.deleteById(mockImagenId, mockReclamoId, mockOtherActorId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if imagen not found', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);
      imagenRepository.findById.mockResolvedValue(null);

      await expect(
        service.deleteById(mockImagenId, mockReclamoId, mockActorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if imagen does not belong to reclamo', async () => {
      reclamoRepository.findById.mockResolvedValue(mockReclamo);
      imagenRepository.findById.mockResolvedValue({
        ...mockImagen,
        fkReclamo: new Types.ObjectId().toString(),
      });

      await expect(
        service.deleteById(mockImagenId, mockReclamoId, mockActorId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
