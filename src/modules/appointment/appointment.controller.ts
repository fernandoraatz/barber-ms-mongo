import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // ---- cliente cria agendamento
  @UseGuards(JwtAuthGuard) // qualquer usuário autenticado
  @Post()
  create(@Req() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.createForUser(req.user.userId, dto);
  }

  // ---- minhas consultas (cliente)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  myAppointments(@Req() req, @Query() q: Omit<QueryAppointmentsDto, 'userId'>) {
    return this.appointmentService.listForMe(req.user.userId, q);
  }

  // ---- agenda do profissional logado
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('professional/me')
  myProfessionalAppointments(
    @Req() req,
    @Query() q: Omit<QueryAppointmentsDto, 'professionalId' | 'userId'>,
  ) {
    return this.appointmentService.listForMyProfessional(req.user.userId, q);
  }

  // ---- admin: listar por filtros
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  list(@Query() q: QueryAppointmentsDto) {
    return this.appointmentService.list(q);
  }

  // ---- cancelar (cliente pode cancelar o seu; prof/admin qualquer)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Req() req, @Param('id') id: string, @Body() body: CancelAppointmentDto) {
    const isAdminOrProf = [UserRole.ADMIN, UserRole.PROFESSIONAL].includes(req.user.role);
    return this.appointmentService.cancel(id, req.user.userId, isAdminOrProf, body?.reason);
  }

  // ---- concluir (profissional/admin)
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.appointmentService.complete(id, true);
  }

  // ---- remarcar
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reschedule')
  reschedule(@Req() req, @Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    const isAdminOrProf = [UserRole.ADMIN, UserRole.PROFESSIONAL].includes(req.user.role);
    return this.appointmentService.reschedule(id, req.user.userId, isAdminOrProf, dto);
  }

  // ---- slots do dia (para montar UI de seleção)
  @Get('professional/:professionalId/slots')
  dailySlots(
    @Param('professionalId') professionalId: string,
    @Query('date') dateISO: string,
    @Query('slotMinutes') slotMinutes?: string,
  ) {
    return this.appointmentService.dailySlots(professionalId, dateISO, Number(slotMinutes) || 60);
  }
}
