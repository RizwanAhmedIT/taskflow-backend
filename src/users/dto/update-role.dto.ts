import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, example: 'MEMBER' })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
