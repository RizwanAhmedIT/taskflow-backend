import { IsNotEmpty, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TodoStatus } from '@prisma/client';

export class BulkStatusDto {
  @ApiProperty({ description: 'Array of todo IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  todoIds: string[];

  @ApiProperty({ enum: TodoStatus, description: 'Target status for all selected todos' })
  @IsNotEmpty()
  @IsEnum(TodoStatus)
  status: TodoStatus;
}
