import { ApiProperty } from '@nestjs/swagger';
import { ReclamoResponseDto } from './reclamo-response.dto';

export class PaginatedReclamoResponseDto {
    
    @ApiProperty({ type: () => ReclamoResponseDto, isArray: true, description: 'Lista de reclamos en la página actual.' })
    readonly data: ReclamoResponseDto[];

    @ApiProperty({ example: 450 })
    readonly total: number;

    @ApiProperty({ example: 5 })
    readonly page: number;

    @ApiProperty({ example: 10 })
    readonly limit: number;
}