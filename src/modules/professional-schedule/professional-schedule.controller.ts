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
import { ProfessionalScheduleService } from './professional-schedule.service';
import { CreateScheduleSegmentDto } from './dto/create-segment.dto';
import { UpdateScheduleSegmentDto } from './dto/update-segment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { ProfessionalService } from '../professional/professional.service';

@Controller('professional-schedule')
export class ProfessionalScheduleController {
  constructor(
    private readonly scheduleService: ProfessionalScheduleService,
    private readonly professionalService: ProfessionalService,
  ) {}

  // -------- ADMIN CRUD --------
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateScheduleSegmentDto) {
    return this.scheduleService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get(':professionalId')
  listByProfessional(@Param('professionalId') professionalId: string) {
    return this.scheduleService.findAllByProfessional(professionalId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Patch('segment/:id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleSegmentDto) {
    return this.scheduleService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Delete('segment/:id')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }

  // -------- PROFISSIONAL (meu) --------
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('me')
  async mySegments(@Req() req) {
    const prof = await this.professionalService.getMyProfile(req.user.userId);
    return this.scheduleService.mySegments(prof._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Post('me')
  async createForMe(
    @Req() req,
    @Body() body: { weekday: number; startTime: string; endTime: string },
  ) {
    const prof = await this.professionalService.getMyProfile(req.user.userId);
    return this.scheduleService.createForMe(
      prof._id.toString(),
      body.weekday,
      body.startTime,
      body.endTime,
    );
  }

  // -------- Slots por dia (público ou protegido, você decide; aqui deixo público) --------
  @Get(':professionalId/slots')
  getDaily(
    @Param('professionalId') professionalId: string,
    @Query() q: { date: string; slotMinutes?: number; skipPast?: 'true' | 'false' },
  ) {
    return this.scheduleService.dailySlots(professionalId, q);
  }
}
