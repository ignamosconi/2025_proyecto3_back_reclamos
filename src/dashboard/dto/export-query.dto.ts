// src/dashboard/dto/export-query.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum ExportFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
}

export class ExportQueryDto {
  @ApiProperty({
    description: 'Formato de exportación',
    enum: ExportFormat,
    example: ExportFormat.XLSX,
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  // Additional filters will be inherited from the respective dashboard query DTOs
}

