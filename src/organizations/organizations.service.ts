import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto, userId?: string) {
    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
      },
    });

    if (userId) {
      // Assign creator as OWNER of new org when the request is authenticated
      await this.prisma.user.update({
        where: { id: userId },
        data: { organizationId: org.id, role: 'OWNER' },
      });
    }

    return org;
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true, projects: true, todos: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string) {
    await this.ensureOrgAdminAccess(id, userId);

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async getMembers(orgId: string) {
    return this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(orgId: string, userEmail: string, requestingUserId: string) {
    await this.ensureOrgAdminAccess(orgId, requestingUserId);

    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    if (user.organizationId === orgId) {
      throw new ForbiddenException(
        'User is already a member of this organization',
      );
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { organizationId: orgId, role: 'MEMBER' },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async removeMember(orgId: string, userId: string, requestingUserId: string) {
    await this.ensureOrgAdminAccess(orgId, requestingUserId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, organizationId: true },
    });

    if (!user || user.organizationId !== orgId) {
      throw new NotFoundException('User not found in this organization');
    }

    if (user.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: null, role: 'MEMBER' },
      select: { id: true, name: true, email: true },
    });
  }

  private async ensureOrgAdminAccess(orgId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, organizationId: true },
    });

    if (!user || user.organizationId !== orgId) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    if (!['OWNER', 'ADMIN'].includes(user.role)) {
      throw new ForbiddenException(
        'Only owners and admins can perform this action',
      );
    }
  }
}
