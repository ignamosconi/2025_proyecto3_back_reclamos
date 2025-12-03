import { Injectable, Inject } from '@nestjs/common';
import type { IImagenRepository } from '../reclamo/repositories/interfaces/imagen.repository.interface';
import type { IReclamoRepository } from '../reclamo/repositories/interfaces/reclamo.repository.interface';
import { IImagenRepository as IImagenRepositoryToken } from '../reclamo/repositories/interfaces/imagen.repository.interface';

@Injectable()
export class ImagenSeeder {
  constructor(
    @Inject(IImagenRepositoryToken)
    private readonly imagenRepo: IImagenRepository,
    @Inject('IReclamoRepository')
    private readonly reclamoRepo: IReclamoRepository,
  ) {}

  async run() {
    console.log('--- Seeding Imágenes ---');

    // Obtener reclamos
    const reclamosResponse = await this.reclamoRepo.findAllPaginated({ limit: 200, page: 1 });
    const reclamos = reclamosResponse.data;

    if (reclamos.length === 0) {
      console.log('No hay reclamos disponibles. Saltando seed de Imágenes.');
      return;
    }

    // Seleccionar algunos reclamos para agregar imágenes (30-40% de los reclamos)
    const reclamosParaImagen = reclamos
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(reclamos.length * 0.35));

    const nombresImagenes = [
      'evidencia-error-login.png',
      'captura-pantalla-error.png',
      'imagen-problema.png',
      'screenshot-bug.png',
      'evidencia-incidencia.png',
      'captura-problema.png',
      'imagen-reclamo.png',
      'evidencia-falla.png',
      'screenshot-error.png',
      'imagen-documento.png',
      'captura-pantalla.png',
      'evidencia-problema.png',
      'screenshot-incidencia.png',
      'imagen-bug.png',
      'evidencia-error.png',
    ];

    const tiposImagen = ['image/png', 'image/jpeg', 'image/jpg'];

    // Crear un buffer pequeño para una imagen placeholder (1x1 pixel PNG transparente en base64)
    // Esto es un PNG válido de 1x1 pixel transparente
    const placeholderPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const placeholderBuffer = Buffer.from(placeholderPngBase64, 'base64');

    let created = 0;
    let skipped = 0;

    for (const reclamo of reclamosParaImagen) {
      const reclamoId = String((reclamo as any)._id || reclamo.id);

      // Verificar si ya tiene imágenes
      const imagenesExistentes = await this.imagenRepo.findByReclamo(reclamoId);
      if (imagenesExistentes.length > 0) {
        skipped++;
        continue;
      }

      // Agregar 1-3 imágenes por reclamo
      const numImagenes = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numImagenes; i++) {
        const nombreIndex = Math.floor(Math.random() * nombresImagenes.length);
        const tipoIndex = Math.floor(Math.random() * tiposImagen.length);
        const nombre = `${nombresImagenes[nombreIndex].replace('.png', '')}-${i + 1}.${tiposImagen[tipoIndex].split('/')[1]}`;

        try {
          await this.imagenRepo.create(
            nombre,
            tiposImagen[tipoIndex],
            placeholderBuffer,
            reclamoId,
          );
          created++;
        } catch (error) {
          console.error(`Error al crear imagen para reclamo ${reclamoId}:`, error);
        }
      }
    }

    console.log(`Imágenes procesadas: ${created} creadas, ${skipped} reclamos ya tenían imágenes.`);
  }
}
