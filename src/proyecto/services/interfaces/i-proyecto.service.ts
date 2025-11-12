import { CreateProyectoDto } from "src/proyecto/dto/create-proyecto.dto";
import { FilterProyectoDto } from "src/proyecto/dto/filter-proyecto.dto";
import { UpdateProyectoDto } from "src/proyecto/dto/update-proyecto.dto";
import { ProjectDocument } from "src/proyecto/schemas/proyecto.schema";


/**
 * Define el contrato de las operaciones de negocio para la gestión de Proyectos.
 */
export interface IProyectoService {
  /**
   * Crea un nuevo proyecto. Incluye la validación de unicidad del nombre.
   * @param data Datos del proyecto.
   */
  createProject(data: CreateProyectoDto): Promise<ProjectDocument>;

  /**
   * Obtiene un proyecto por ID.
   * @param id ID del proyecto.
   */
  getProjectById(id: string): Promise<ProjectDocument>; // Lanza excepción si no existe

  /**
   * Obtiene la lista de proyectos aplicando filtros.
   * @param filters Filtros opcionales (cliente, área).
   */
  getProjects(filters: FilterProyectoDto): Promise<ProjectDocument[]>;

  /**
   * Actualiza un proyecto existente. Incluye la validación de unicidad del nombre.
   * @param id ID del proyecto.
   * @param data Datos a actualizar.
   */
  updateProject(id: string, data: UpdateProyectoDto): Promise<ProjectDocument>;

  /**
   * Elimina suavemente (soft delete) un proyecto.
   * @param id ID del proyecto.
   */
  deleteProject(id: string): Promise<boolean>;

  /**
   * Restaura un proyecto eliminado suavemente.
   * @param id ID del proyecto.
   */
  restoreProject(id: string): Promise<boolean>;
}