import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { TodoStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId: string, organizationId: string) {
    return this.prisma.project.create({
      data: {
        ...dto,
        createdById: userId,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string, query: PaginationQueryDto) {
    const where: any = { organizationId, deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { todos: true } },
        },
        skip: query.skip,
        take: query.limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: projects,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  async findById(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { todos: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Project deleted successfully' };
  }

  async getStats(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const statusCounts = await this.prisma.todo.groupBy({
      by: ['status'],
      where: { projectId: id, deletedAt: null },
      _count: { status: true },
    });

    const total = await this.prisma.todo.count({
      where: { projectId: id, deletedAt: null },
    });

    const byStatus: Record<string, number> = {};
    for (const s of statusCounts) {
      byStatus[s.status] = s._count.status;
    }

    return {
      projectId: id,
      projectName: project.name,
      total,
      byStatus,
      completionRate:
        total > 0
          ? Math.round(((byStatus['DONE'] || 0) / total) * 100)
          : 0,
    };
  }
}
