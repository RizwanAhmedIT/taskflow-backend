import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Tags')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  create(
    @Body() dto: CreateTagDto,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.tagsService.create(dto, organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'List all tags in your organization' })
  findAll(@CurrentUser('organizationId') organizationId: string) {
    return this.tagsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.tagsService.findById(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.tagsService.update(id, dto, organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tag' })
  remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.tagsService.remove(id, organizationId);
  }
}
