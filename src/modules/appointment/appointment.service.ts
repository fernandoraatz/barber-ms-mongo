import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument, AppointmentStatus } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryMyAppointmentsDto } from './dto/query-appointment.dto';
import { Service as Svc, ServiceDocument } from '../service/schemas/service.schema';
import {
  Professional,
  ProfessionalDocument,
  ProfessionalStatus,
} from '../professional/schemas/professional.schema';
import { ScheduleService } from '../schedule/schedule.service';

const toUTCFromLocalYMDTime = (ymd: string, hhmm: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  // America/Sao_Paulo (-03): UTC = local + 3h
  return new Date(Date.UTC(y, m - 1, d, h + 3, min, 0, 0));
};

@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name) private readonly apptModel: Model<AppointmentDocument>,
    @InjectModel(Svc.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Professional.name) private readonly professionalModel: Model<ProfessionalDocument>,
    private readonly scheduleService: ScheduleService,
  ) {}

  private async assertServiceActive(serviceId: string) {
    const svc = await this.serviceModel.findById(serviceId).lean().exec();
    if (!svc) throw new NotFoundException('Serviço não encontrado');
    if (!svc.status) throw new BadRequestException('Serviço inativo');
    return svc;
  }

  private async assertProfessionalActive(professionalId: string) {
    const prof = await this.professionalModel.findById(professionalId).lean().exec();
    if (!prof) throw new NotFoundException('Profissional não encontrado');
    if (prof.status !== ProfessionalStatus.ACTIVE) {
      throw new BadRequestException('Profissional inativo');
    }
    return prof;
  }

  // criar agendamento (60min fixo) validando com Schedule
  async createForUser(userId: string, dto: CreateAppointmentDto) {
    await this.assertProfessionalActive(dto.professionalId);
    await this.assertServiceActive(dto.serviceId);

    // valida slot existe e está livre (já considera domingos, pausas, blackouts, passados e já agendados)
    const slots = await this.scheduleService.daySlots(dto.professionalId, dto.date);
    if (!slots.includes(dto.time)) {
      throw new BadRequestException('Horário indisponível para este dia');
    }

    const startAt = toUTCFromLocalYMDTime(dto.date, dto.time);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

    try {
      return await this.apptModel.create({
        userId: new Types.ObjectId(userId),
        professionalId: new Types.ObjectId(dto.professionalId),
        serviceId: new Types.ObjectId(dto.serviceId),
        startAt,
        endAt,
        status: AppointmentStatus.SCHEDULED,
        notes: dto.notes,
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new BadRequestException('Horário acabou de ser reservado por outra pessoa');
      }
      throw e;
    }
  }

  // listar meus agendamentos
  async listMine(userId: string, q: QueryMyAppointmentsDto) {
    const { from, to, page = 1, limit = 10 } = q;
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (from || to) {
      filter.startAt = {};
      if (from) filter.startAt.$gte = new Date(from);
      if (to) filter.startAt.$lte = new Date(to);
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.apptModel.find(filter).sort({ startAt: -1 }).skip(skip).limit(limit).exec(),
      this.apptModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit };
  }

  // marcar como finalizado (opcional: profissional/admin)
  async complete(id: string) {
    const updated = await this.apptModel
      .findByIdAndUpdate(id, { status: AppointmentStatus.COMPLETED }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Agendamento não encontrado');
    return updated;
  }
}
