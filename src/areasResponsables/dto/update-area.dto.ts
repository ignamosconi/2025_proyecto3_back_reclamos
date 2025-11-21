import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAreaDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
