import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(todoId: string, dto: CreateCommentDto, userId: string, organizationId: string) {
    // Verify todo exists and belongs to the user's org
    const todo = await this.prisma.todo.findFirst({
      where: { id: todoId, organizationId },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        todoId,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async findAll(todoId: string, organizationId: string, query: PaginationQueryDto) {
    // Verify todo exists and belongs to the user's org
    const todo = await this.prisma.todo.findFirst({
      where: { id: todoId, organizationId },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { todoId },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where: { todoId } }),
    ]);

    return {
      items: comments,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  async update(commentId: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { message: 'Comment deleted successfully' };
  }
}
