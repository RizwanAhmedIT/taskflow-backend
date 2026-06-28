import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTodoDto } from './dto/create-todo.dto.js';
import { UpdateTodoDto } from './dto/update-todo.dto.js';
import { TodoFilterDto } from './dto/todo-filter.dto.js';
import { AssignTodoDto } from './dto/assign-todo.dto.js';
import { BulkStatusDto } from './dto/bulk-status.dto.js';
import { TodoStatus } from '@prisma/client';

@Injectable()
export class TodosService {
  private readonly logger = new Logger(TodosService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Create ──────────────────────────────────────────────────────────────

  async create(dto: CreateTodoDto, userId: string, organizationId: string) {
    const { tagIds, ...todoData } = dto;

    const todo = await this.prisma.todo.create({
      data: {
        ...todoData,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        creatorId: userId,
        organizationId,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    await this.logActivity(userId, 'CREATE', 'Todo', todo.id, null);

    return this.formatTodoResponse(todo);
  }

  // ── Find All (with filtering & pagination) ──────────────────────────────

  async findAll(organizationId: string, query: TodoFilterDto) {
    const where: any = { organizationId };

    // Only show non-deleted by default
    if (!query.includeDeleted) {
      where.deletedAt = null;
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.projectId) where.projectId = query.projectId;

    if (query.tagId) {
      where.tags = { some: { tagId: query.tagId } };
    }

    if (query.dueBefore || query.dueAfter) {
      where.dueDate = {};
      if (query.dueBefore) where.dueDate.lte = new Date(query.dueBefore);
      if (query.dueAfter) where.dueDate.gte = new Date(query.dueAfter);
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    const sortField = query.sortBy ?? 'createdAt';
    orderBy[sortField] = query.sortOrder ?? 'desc';

    const [todos, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, color: true } },
          _count: { select: { comments: true } },
        },
        skip: query.skip,
        take: query.limit,
        orderBy,
      }),
      this.prisma.todo.count({ where }),
    ]);

    return {
      items: todos.map((t) => this.formatTodoResponse(t)),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  // ── Find By ID ──────────────────────────────────────────────────────────

  async findById(id: string, organizationId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, organizationId },
      include: {
        tags: { include: { tag: true } },
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { comments: true } },
      },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return this.formatTodoResponse(todo);
  }

  // ── Update ──────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateTodoDto,
    userId: string,
    organizationId: string,
  ) {
    const existing = await this.prisma.todo.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Todo not found');
    }

    const { tagIds, ...updateData } = dto;

    // Track status changes
    let completedAt = existing.completedAt;
    if (dto.status === TodoStatus.DONE && existing.status !== TodoStatus.DONE) {
      completedAt = new Date();
    } else if (dto.status && dto.status !== TodoStatus.DONE) {
      completedAt = null;
    }

    const todo = await this.prisma.todo.update({
      where: { id },
      data: {
        ...updateData,
        dueDate: dto.dueDate
          ? new Date(dto.dueDate)
          : updateData.dueDate === null
            ? null
            : undefined,
        completedAt,
        tags: tagIds
          ? {
              deleteMany: {},
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        tags: { include: { tag: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    // Build changes diff for audit log
    const changes: Record<string, { from: any; to: any }> = {};
    for (const key of Object.keys(updateData)) {
      if ((existing as any)[key] !== (updateData as any)[key]) {
        changes[key] = {
          from: (existing as any)[key],
          to: (updateData as any)[key],
        };
      }
    }

    await this.logActivity(userId, 'UPDATE', 'Todo', id, changes);

    return this.formatTodoResponse(todo);
  }

  // ── Soft Delete ─────────────────────────────────────────────────────────

  async remove(id: string, userId: string, organizationId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    await this.prisma.todo.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.logActivity(userId, 'DELETE', 'Todo', id, null);

    return { message: 'Todo deleted successfully' };
  }

  // ── Restore ─────────────────────────────────────────────────────────────

  async restore(id: string, userId: string, organizationId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, organizationId, deletedAt: { not: null } },
    });

    if (!todo) {
      throw new NotFoundException('Deleted todo not found');
    }

    const restored = await this.prisma.todo.update({
      where: { id },
      data: { deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, color: true } },
      },
    });

    await this.logActivity(userId, 'RESTORE', 'Todo', id, null);

    return this.formatTodoResponse(restored);
  }

  // ── Assign ──────────────────────────────────────────────────────────────

  async assign(
    id: string,
    dto: AssignTodoDto,
    userId: string,
    organizationId: string,
  ) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    // Verify assignee belongs to the same org
    const assignee = await this.prisma.user.findFirst({
      where: { id: dto.assigneeId, organizationId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found in your organization');
    }

    const updated = await this.prisma.todo.update({
      where: { id },
      data: { assigneeId: dto.assigneeId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(userId, 'ASSIGN', 'Todo', id, {
      assigneeId: { from: todo.assigneeId, to: dto.assigneeId },
    });

    return updated;
  }

  // ── Bulk Status Update ──────────────────────────────────────────────────

  async bulkUpdateStatus(
    dto: BulkStatusDto,
    userId: string,
    organizationId: string,
  ) {
    const completedAt = dto.status === TodoStatus.DONE ? new Date() : null;

    const result = await this.prisma.todo.updateMany({
      where: {
        id: { in: dto.todoIds },
        organizationId,
        deletedAt: null,
      },
      data: {
        status: dto.status,
        completedAt,
      },
    });

    await this.logActivity(
      userId,
      'BULK_STATUS',
      'Todo',
      dto.todoIds.join(','),
      {
        status: dto.status,
        count: result.count,
      },
    );

    return {
      message: `Updated ${result.count} todos to ${dto.status}`,
      count: result.count,
    };
  }

  // ── Dashboard Stats ─────────────────────────────────────────────────────

  async getStats(organizationId: string) {
    const [statusCounts, priorityCounts, overdueTodos, recentActivity] =
      await Promise.all([
        this.prisma.todo.groupBy({
          by: ['status'],
          where: { organizationId, deletedAt: null },
          _count: { status: true },
        }),
        this.prisma.todo.groupBy({
          by: ['priority'],
          where: { organizationId, deletedAt: null },
          _count: { priority: true },
        }),
        this.prisma.todo.count({
          where: {
            organizationId,
            deletedAt: null,
            status: { not: TodoStatus.DONE },
            dueDate: { lt: new Date() },
          },
        }),
        this.prisma.activityLog.findMany({
          where: {
            todo: { organizationId },
          },
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    const totalTodos = await this.prisma.todo.count({
      where: { organizationId, deletedAt: null },
    });

    const byStatus: Record<string, number> = {};
    for (const s of statusCounts) {
      byStatus[s.status] = s._count.status;
    }

    const byPriority: Record<string, number> = {};
    for (const p of priorityCounts) {
      byPriority[p.priority] = p._count.priority;
    }

    return {
      total: totalTodos,
      byStatus,
      byPriority,
      overdue: overdueTodos,
      completionRate:
        totalTodos > 0
          ? Math.round(((byStatus['DONE'] || 0) / totalTodos) * 100)
          : 0,
      recentActivity,
    };
  }

  // ── Private Helpers ─────────────────────────────────────────────────────

  private formatTodoResponse(todo: any) {
    const { tags, ...rest } = todo;
    return {
      ...rest,
      tags: tags?.map((tt: any) => tt.tag) || [],
    };
  }

  private async logActivity(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    changes: any,
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          changes,
          todoId: entity === 'Todo' ? entityId : undefined,
        },
      });
    } catch (error) {
      // Don't fail the main operation if logging fails
      this.logger.error(`Failed to log activity: ${error}`);
    }
  }
}
