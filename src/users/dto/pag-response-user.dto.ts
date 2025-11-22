import { ApiProperty } from '@nestjs/swagger';
import { User } from '../schemas/user.schema';

export class PaginationResponseUserDto {
  @ApiProperty({ type: () => User, isArray: true })
  data: User[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}