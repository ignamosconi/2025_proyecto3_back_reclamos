import { Imagen } from '../../schemas/imagen.schema';

export interface IImagenRepository {
  /**
   * Crea una nueva imagen y la asocia a un reclamo.
   */
  create(nombre: string, tipo: string, imagenBuffer: Buffer, fkReclamo: string): Promise<Imagen>;

  /**
   * Obtiene las imágenes asociadas a un reclamo.
   */
  findByReclamo(reclamoId: string): Promise<Imagen[]>;

  /**
   * Obtiene una imagen por su id.
   */
  findById(id: string): Promise<Imagen | null>;

  /**
   * Elimina una imagen por id.
   */
  deleteById(id: string): Promise<void>;

  /**
   * Actualiza una imagen por id. Retorna la imagen actualizada o null.
   */
  updateById(id: string, updates: Partial<{ nombre: string; tipo: string; imagen: Buffer }>): Promise<Imagen | null>;
}

export const IImagenRepository = Symbol('IImagenRepository');
