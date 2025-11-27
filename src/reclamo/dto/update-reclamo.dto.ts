import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

/**
 * DTO para actualizar un reclamo.
 * Solo permite modificar `titulo` y `descripcion`.
 * Además la lógica de negocio exige que el reclamo esté en estado PENDIENTE
 * y que el usuario sea el propietario del reclamo (validado en el servicio).
 */
export class UpdateReclamoDto {
	@ApiPropertyOptional({ description: 'Título del reclamo', example: 'Nuevo título', minLength: 3, maxLength: 255 })
	@IsOptional()
	@IsString()
	@Length(3, 255)
	titulo?: string;

	@ApiPropertyOptional({ description: 'Descripción del reclamo', example: 'Detalles adicionales del problema' })
	@IsOptional()
	@IsString()
	@Length(3, 2000)
	descripcion?: string;
}