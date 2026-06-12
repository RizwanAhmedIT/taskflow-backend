import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTodoDto {
  @ApiProperty({ description: 'UUID of the user to assign this todo to' })
  @IsNotEmpty()
  @IsUUID()
  assigneeId: string;
}
