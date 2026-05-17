import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.teamsService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: { name: string }) {
    return this.teamsService.create(user.id, body.name);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { name?: string; memberIds?: string[] }
  ) {
    return this.teamsService.update(user.id, id, body.name, body.memberIds);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.teamsService.remove(user.id, id);
  }
}
