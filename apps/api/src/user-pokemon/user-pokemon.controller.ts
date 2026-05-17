import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { JwtUser } from '../auth/jwt.strategy';
import { CreateUserPokemonDto } from './dto/create-user-pokemon.dto';
import { UpdateUserPokemonDto } from './dto/update-user-pokemon.dto';
import { UserPokemonService } from './user-pokemon.service';

@UseGuards(JwtAuthGuard)
@Controller('collection')
export class UserPokemonController {
  constructor(private readonly userPokemonService: UserPokemonService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.userPokemonService.list(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() body: CreateUserPokemonDto) {
    return this.userPokemonService.create(user.sub, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: UpdateUserPokemonDto,
  ) {
    return this.userPokemonService.update(user.sub, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.userPokemonService.remove(user.sub, id);
  }
}
