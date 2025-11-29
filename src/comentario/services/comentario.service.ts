import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comentario } from '../schemas/comentario.schema';
import type { IComentarioRepository } from '../repositories/interfaces/comentario.repository.interface';
import { ICOMENTARIO_REPOSITORY } from '../repositories/interfaces/comentario.repository.interface';
import type { IComentarioService } from './interfaces/comentario.service.interface';
import { CreateComentarioDto } from '../dto/create-comentario.dto';
import { IReclamoRepository } from 'src/reclamo/repositories/interfaces/reclamo.repository.interface';
import { IReclamoEncargadoRepository } from 'src/reclamo/repositories/interfaces/reclamo-encargado.repository.interface';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { HistorialService } from 'src/historial/historial.service';
import { AccionesHistorial } from 'src/historial/helpers/acciones-historial.enum';

@Injectable()
export class ComentarioService implements IComentarioService {
  private readonly logger = new Logger(ComentarioService.name);

  constructor(
    @Inject(ICOMENTARIO_REPOSITORY)
    private readonly comentarioRepository: IComentarioRepository,
    @Inject('IReclamoRepository')
    private readonly reclamoRepository: IReclamoRepository,
    @Inject('IReclamoEncargadoRepository')
    private readonly reclamoEncargadoRepository: IReclamoEncargadoRepository,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly historialService: HistorialService,
  ) {}

  async create(
    reclamoId: string,
    data: CreateComentarioDto,
    autorId: string,
    autorRole: string,
  ): Promise<Comentario> {
    // 1. Validar que el reclamo existe
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) {
      throw new NotFoundException('Reclamo no encontrado');
    }

    // 2. Validar permisos: solo Gerente o encargados asignados pueden comentar
    await this.validatePermission(reclamoId, autorId, autorRole);

    // 3. Crear el comentario
    const comentario = await this.comentarioRepository.create(
      data.texto,
      autorId,
      reclamoId,
    );

    // 4. Registrar en historial
    const textoTruncado = data.texto.length > 200 
      ? data.texto.substring(0, 200) + '...' 
      : data.texto;
    
    await this.historialService.create(
      reclamoId,
      AccionesHistorial.COMENTAR_RECLAMO,
      `Comentario agregado: "${textoTruncado}"`,
      autorId,
      {
        comentarioId: String(comentario._id),
      },
    );

    this.logger.log(`Comentario creado por usuario ${autorId} en reclamo ${reclamoId}`);

    // 5. Poblar el autor antes de retornar
    await comentario.populate('autor', 'firstName lastName email');
    return comentario;
  }

  async findByReclamoId(
    reclamoId: string,
    userId: string,
    userRole: string,
  ): Promise<Comentario[]> {
    // 1. Validar que el reclamo existe
    const reclamo = await this.reclamoRepository.findById(reclamoId, false);
    if (!reclamo) {
      throw new NotFoundException('Reclamo no encontrado');
    }

    // 2. Validar permisos: solo Gerente o encargados asignados pueden ver comentarios
    await this.validatePermission(reclamoId, userId, userRole);

    // 3. Obtener comentarios
    return this.comentarioRepository.findByReclamoId(reclamoId);
  }

  /**
   * Valida que el usuario tenga permiso para ver/comentar en el reclamo.
   * Gerentes pueden acceder a todos los reclamos.
   * Encargados solo pueden acceder a reclamos donde están asignados.
   */
  private async validatePermission(
    reclamoId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const roleNormalized = String(userRole || '').toUpperCase();

    // Gerente tiene acceso a todos los reclamos
    if (roleNormalized === 'GERENTE') {
      return;
    }

    // Encargado solo puede acceder si está asignado al reclamo
    if (roleNormalized === 'ENCARGADO') {
      const isAssigned = await this.reclamoEncargadoRepository.isEncargadoAssigned(
        reclamoId,
        userId,
      );
      if (!isAssigned) {
        throw new ForbiddenException(
          'No tienes permiso para ver o comentar en este reclamo. Solo puedes acceder a reclamos donde estás asignado.',
        );
      }
      return;
    }

    // Cliente u otros roles no tienen acceso
    throw new ForbiddenException(
      'No tienes permiso para ver o comentar en este reclamo. Solo Gerentes y Encargados asignados pueden acceder.',
    );
  }
}

