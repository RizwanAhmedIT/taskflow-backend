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
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.projectsService.create(dto, userId, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects' })
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.projectsService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.projectsService.findById(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.projectsService.update(id, dto, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a project' })
  remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.projectsService.remove(id, organizationId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get project statistics' })
  getStats(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.projectsService.getStats(id, organizationId);
  }
}
