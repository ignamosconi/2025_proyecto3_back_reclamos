import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/users/helpers/enum.roles';

export class EncargadoResponseDto {
  @ApiProperty({ type: String, format: 'ObjectId', example: '60c72b2f9c3f9a0015b67e80' })
  readonly _id: string;

  @ApiProperty({ example: 'Juan García' })
  readonly nombre: string;

  @ApiProperty({ example: 'juan@example.com' })
  readonly email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ENCARGADO })
  readonly role: UserRole;
}
