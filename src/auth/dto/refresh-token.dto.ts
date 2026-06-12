import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token received during login' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
