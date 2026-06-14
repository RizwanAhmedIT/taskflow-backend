import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Comments')
@ApiBearerAuth('default')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('todos/:todoId/comments')
  @ApiOperation({ summary: 'Add a comment to a todo' })
  create(
    @Param('todoId') todoId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.commentsService.create(todoId, dto, userId, organizationId);
  }

  @Get('todos/:todoId/comments')
  @ApiOperation({ summary: 'List all comments on a todo' })
  findAll(
    @Param('todoId') todoId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.commentsService.findAll(todoId, organizationId, query);
  }

  @Patch('comments/:id')
  @ApiOperation({ summary: 'Update your own comment' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.update(id, dto, userId);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete your own comment' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.commentsService.remove(id, userId);
  }
}
