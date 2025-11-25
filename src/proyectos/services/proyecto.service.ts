import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateProyectoDto } from '../dto/create-proyecto.dto';
import { UpdateProyectoDto } from '../dto/update-proyecto.dto';
import { ProyectoDocument } from '../schemas/proyecto.schema';
import { IProyectosService } from './proyecto.service.interface';
import type { IProyectosRepository } from '../repositories/proyecto.repository.interface';
import { GetProyectosQueryDto } from '../dto/get-proyecto-query.dto';
import { PaginationResponseProyectoDto } from '../dto/pag-proyecto.dto';
import { Area, AreaDocument } from 'src/area/schemas/area.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ProyectosService implements IProyectosService {
  constructor(
    @Inject('IProyectosRepository')
    private readonly proyectoRepository: IProyectosRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>, 
    @InjectModel(Area.name) private areaModel: Model<AreaDocument>,
  ) {}


  async create(data: CreateProyectoDto): Promise<ProyectoDocument> {
    
    // 1. VALIDACIÓN DE UNICIDAD DEL NOMBRE
    const existing = await this.proyectoRepository.findByName(data.nombre);
    if (existing) {
        throw new ConflictException(
            `Ya existe un proyecto activo con el nombre: ${data.nombre}`,
        );
    }

    // 2. VALIDACIÓN DE INTEGRIDAD REFERENCIAL
    
    const clienteId = new Types.ObjectId(data.cliente);
    const areaId = new Types.ObjectId(data.areaResponsable);
    
    // a) Validar Cliente
    // Buscamos que exista Y que tenga el rol de 'Cliente'
    const clienteExists = await this.userModel.exists({ 
        _id: clienteId, 
        //rol: 'Cliente',
    });
    
    if (!clienteExists) {
        throw new NotFoundException(
            `Cliente con ID "${data.cliente}" no encontrado o no tiene el rol de Cliente.`
        );
    }
    
    // b) Validar Área
    const areaExists = await this.areaModel.exists({ 
        _id: areaId 
    });
    
    if (!areaExists) {
        throw new NotFoundException(
            `Área Responsable con ID "${data.areaResponsable}" no encontrada.`
        );
    }
    
    // 3. CREACIÓN DEL PROYECTO
    // Si ambas validaciones pasan, delegamos la creación al repositorio.
    return this.proyectoRepository.create(data);
  }

  async findAll(query: GetProyectosQueryDto): Promise<PaginationResponseProyectoDto> {
    // Se aplica el filtro tal cual viene del Controlador
    return this.proyectoRepository.findAll(query);
  }

  async findById(id: string): Promise<ProyectoDocument> {
    const proyecto = await this.proyectoRepository.findById(id); 

    if (!proyecto) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado.`);
    }
    return proyecto;
  }

  async update(
    id: string,
    data: UpdateProyectoDto,
): Promise<ProyectoDocument> {
    
    // 1. Validación de unicidad si se está actualizando el nombre (Lógica existente)
    if (data.nombre) {
        const existing = await this.proyectoRepository.findByName(data.nombre);
        if (existing && existing.id !== id) {
            throw new ConflictException(
                `Ya existe otro proyecto activo con el nombre: ${data.nombre}`,
            );
        }
    }

    // 2. VALIDACIÓN DE INTEGRIDAD REFERENCIAL (NUEVA LÓGICA)

    // a) Validar Cliente: SOLO si 'cliente' está presente en el DTO de actualización
    if (data.cliente) {
        const clienteId = new Types.ObjectId(data.cliente);
        const clienteExists = await this.userModel.exists({ 
            _id: clienteId, 
            //rol: 'Cliente',
        });
        
        if (!clienteExists) {
            throw new NotFoundException(
                `Cliente con ID "${data.cliente}" no encontrado o no tiene el rol de Cliente.`
            );
        }
    }

    // b) Validar Área: SOLO si 'areaResponsable' está presente en el DTO de actualización
    if (data.areaResponsable) {
        const areaId = new Types.ObjectId(data.areaResponsable);
        const areaExists = await this.areaModel.exists({ _id: areaId });
        
        if (!areaExists) {
            throw new NotFoundException(
                `Área Responsable con ID "${data.areaResponsable}" no encontrada.`
            );
        }
    }

    // 3. Ejecución de la actualización
    const updatedProyecto = await this.proyectoRepository.update(id, data);
    
    // 4. Validación de existencia del proyecto a actualizar
    if (!updatedProyecto) {
        throw new NotFoundException(`Proyecto con ID ${id} no encontrado.`);
    }
    
    return updatedProyecto;
  }

  async delete(id: string): Promise<void> {
    const deletedProyecto = await this.proyectoRepository.softDelete(id);

    if (!deletedProyecto) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado.`);
    }
  }
}