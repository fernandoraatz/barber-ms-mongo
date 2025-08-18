import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfessionalService } from './professional.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { QueryProfessionalDto } from './dto/query-professional.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';

@Controller('professionals')
export class ProfessionalController {
  constructor(private readonly professionalService: ProfessionalService) {}

  // Público
  @Get()
  search(@Query() query: QueryProfessionalDto) {
    return this.professionalService.search(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.professionalService.findById(id);
  }

  // Admin-only CRUD
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateProfessionalDto) {
    return this.professionalService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProfessionalDto) {
    return this.professionalService.updateById(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.professionalService.deleteById(id);
  }

  // 🔗 Vincular / Desvincular User -> Professional (ADMIN)
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/assign-user/:userId')
  assignUser(@Param('id') professionalId: string, @Param('userId') userId: string) {
    return this.professionalService.assignUser(professionalId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id/unassign-user')
  unassignUser(@Param('id') professionalId: string) {
    return this.professionalService.unassignUser(professionalId);
  }

  // 👤 Rotas do próprio profissional (logado)
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('me/profile')
  getMyProfile(@Req() req) {
    return this.professionalService.getMyProfile(req.user.userId);
  }
}
