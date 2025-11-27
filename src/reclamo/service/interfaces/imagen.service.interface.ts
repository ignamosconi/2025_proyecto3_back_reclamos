import { CreateImagenDto } from "src/reclamo/dto/create-imagen.dto";
import { UpdateImagenDto } from "src/reclamo/dto/update-imagen.dto";
import { Imagen } from "src/reclamo/schemas/imagen.schema";

export interface IImagenService {
  create(reclamoId: string, data: CreateImagenDto, actorId: string): Promise<Imagen>;
  update(reclamoId: string, imagenId: string, data: UpdateImagenDto, actorId: string): Promise<Imagen>;
  findByReclamo(reclamoId: string): Promise<Imagen[]>;
  findById(imagenId: string): Promise<Imagen | null>;
  deleteById(imagenId: string, reclamoId: string, actorId: string): Promise<void>;
}

export const IImagenService = Symbol('IImagenService');
