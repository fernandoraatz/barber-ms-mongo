import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, Req } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpsertSettingsDto } from './dto/upsert-settings.dto';
import { CreateBlackoutDto } from './dto/create-blackout.dto';
import { MonthAvailabilityDto } from './dto/month-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { ProfessionalService } from '../professional/professional.service';

@Controller('schedule')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly professionalService: ProfessionalService,
  ) {}

  // ------ SETTINGS (ADMIN) ------
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post(':professionalId/settings')
  upsertSettings(@Param('professionalId') professionalId: string, @Body() dto: UpsertSettingsDto) {
    return this.scheduleService.upsertSettings(professionalId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get(':professionalId/settings')
  getSettings(@Param('professionalId') professionalId: string) {
    return this.scheduleService.getSettings(professionalId);
  }

  // ------ BLACKOUTS (ADMIN) ------
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post('blackouts')
  createBlackout(@Body() dto: CreateBlackoutDto, @Req() req) {
    return this.scheduleService.createBlackout(dto, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Delete('blackouts/:id')
  removeBlackout(@Param('id') id: string) {
    return this.scheduleService.removeBlackout(id);
  }

  // ------ CONSULTAS (PROFISSIONAL) ------
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('me/month-availability')
  async myMonth(@Req() req, @Query() q: MonthAvailabilityDto) {
    const prof = await this.professionalService.getMyProfile(req.user.userId);
    return this.scheduleService.monthAvailability(prof._id.toString(), q);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('me/day-slots')
  async myDay(@Req() req, @Query('date') date: string) {
    const prof = await this.professionalService.getMyProfile(req.user.userId);
    return this.scheduleService.daySlots(prof._id.toString(), date);
  }

  // ------ CONSULTAS (PÚBLICO/APP) ------
  @Get(':professionalId/month-availability')
  monthAvailability(
    @Param('professionalId') professionalId: string,
    @Query() q: MonthAvailabilityDto,
  ) {
    return this.scheduleService.monthAvailability(professionalId, q);
  }

  @Get(':professionalId/day-slots')
  daySlots(@Param('professionalId') professionalId: string, @Query('date') date: string) {
    return this.scheduleService.daySlots(professionalId, date);
  }
}
