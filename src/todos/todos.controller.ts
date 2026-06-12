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
import { TodosService } from './todos.service.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodoFilterDto } from './dto/todo-filter.dto.js';
import { AssignTodoDto } from './dto/assign-todo.dto.js';
import { BulkStatusDto } from './dto/bulk-status.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Todos')
@ApiBearerAuth()
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  create(
    @Body() dto: CreateTodoDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.todosService.create(dto, userId, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List all todos with filtering, sorting, and pagination' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: TodoFilterDto,
  ) {
    return this.todosService.findAll(organizationId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get todo statistics for dashboard' })
  getStats(@CurrentUser('organizationId') organizationId: string) {
    return this.todosService.getStats(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single todo with full details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.todosService.findById(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.todosService.update(id, dto, userId, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a todo' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.todosService.remove(id, userId, organizationId);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted todo' })
  restore(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.todosService.restore(id, userId, organizationId);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a todo to a user' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTodoDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.todosService.assign(id, dto, userId, organizationId);
  }

  @Patch('bulk/status')
  @ApiOperation({ summary: 'Bulk update status for multiple todos' })
  bulkUpdateStatus(
    @Body() dto: BulkStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.todosService.bulkUpdateStatus(dto, userId, organizationId);
  }
}
