import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great progress on this task!' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}
