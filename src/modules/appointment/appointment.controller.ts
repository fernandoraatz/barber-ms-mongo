import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryMyAppointmentsDto } from './dto/query-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // criar (usuário autenticado)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.createForUser(req.user.userId, dto);
  }

  // listar meus (usuário autenticado)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  listMine(@Req() req, @Query() q: QueryMyAppointmentsDto) {
    return this.appointmentService.listMine(req.user.userId, q);
  }

  // (opcional) marcar como finalizado (profissional/admin)
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.appointmentService.complete(id);
  }
}
