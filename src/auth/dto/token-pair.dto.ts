import { ApiProperty } from '@nestjs/swagger';

export class TokenPairDTO {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6I...',
  })
  accessToken: string;

  @ApiProperty({
    example:
      'sLmNvbSIsImlhdCI6MTc1NzcyNjExM...',
  })
  refreshToken: string;
}
