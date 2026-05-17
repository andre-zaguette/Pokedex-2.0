import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.team.findMany({
      where: { userId },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, name: string) {
    return this.prisma.team.create({
      data: {
        userId,
        name,
      },
      include: { members: true },
    });
  }

  async update(userId: string, id: string, name?: string, memberIds?: string[]) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.userId !== userId) throw new ForbiddenException('Access denied');

    if (memberIds) {
      // First disconnect all
      await this.prisma.userPokemon.updateMany({
        where: { teamId: id },
        data: { teamId: null }
      });
      // Connect new ones
      await this.prisma.userPokemon.updateMany({
        where: { id: { in: memberIds }, userId },
        data: { teamId: id }
      });
    }

    if (name) {
      await this.prisma.team.update({
        where: { id },
        data: { name }
      });
    }

    return this.prisma.team.findUnique({
      where: { id },
      include: { members: true }
    });
  }

  async remove(userId: string, id: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.team.delete({ where: { id } });
    return { success: true };
  }
}
