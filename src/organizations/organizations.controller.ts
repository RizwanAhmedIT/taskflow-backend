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
import { OrganizationsService } from './organizations.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationsService.create(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization (Owner/Admin only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationsService.update(id, dto, userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of an organization' })
  getMembers(@Param('id') orgId: string) {
    return this.organizationsService.getMembers(orgId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to the organization by email' })
  addMember(
    @Param('id') orgId: string,
    @Body('email') email: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationsService.addMember(orgId, email, userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the organization' })
  removeMember(
    @Param('id') orgId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('id') requestingUserId: string,
  ) {
    return this.organizationsService.removeMember(orgId, targetUserId, requestingUserId);
  }
}
