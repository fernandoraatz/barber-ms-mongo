import { Controller, Get, Param, Patch, Body, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    return this.userService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@Req() req, @Body() dto: UpdateUserDto) {
    return this.userService.update(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Query() query: QueryUsersDto) {
    return this.userService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
