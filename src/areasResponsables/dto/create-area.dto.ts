import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  @MinLength(3)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
