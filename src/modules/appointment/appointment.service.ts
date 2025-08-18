import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument, AppointmentStatus } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointment.dto';
import {
  Professional,
  ProfessionalDocument,
  ProfessionalStatus,
} from '../professional/schemas/professional.schema';
import { Service as Svc, ServiceDocument } from '../service/schemas/service.schema';
import {
  ProfessionalSchedule,
  ProfessionalScheduleDocument,
} from '../professional-schedule/schemas/professional-schedule.schema';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name) private readonly apptModel: Model<AppointmentDocument>,
    @InjectModel(Professional.name) private readonly professionalModel: Model<ProfessionalDocument>,
    @InjectModel(Svc.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(ProfessionalSchedule.name)
    private readonly scheduleModel: Model<ProfessionalScheduleDocument>,
  ) {}

  // ---- helpers ----
  private async getActiveProfessional(id: string) {
    const prof = await this.professionalModel.findById(id).lean().exec();
    if (!prof) throw new NotFoundException('Profissional não encontrado');
    if (prof.status !== ProfessionalStatus.ACTIVE) {
      throw new BadRequestException('Profissional inativo');
    }
    return prof;
  }

  private async getActiveService(id: string) {
    const svc = await this.serviceModel.findById(id).lean().exec();
    if (!svc) throw new NotFoundException('Serviço não encontrado');
    if (!svc.status) throw new BadRequestException('Serviço inativo');
    return svc;
  }

  private async assertWithinSchedule(professionalId: string, startAt: Date, endAt: Date) {
    // Busca segmentos ativos do dia
    const weekday = startAt.getDay();
    const segments = await this.scheduleModel
      .find({ professionalId, weekday, active: true })
      .lean()
      .exec();

    if (!segments.length) {
      throw new BadRequestException('Profissional não atende neste dia');
    }

    const startM = startAt.getHours() * 60 + startAt.getMinutes();
    const endM = endAt.getHours() * 60 + endAt.getMinutes();

    const fits = segments.some(seg => {
      const s = toMinutes(seg.startTime);
      const e = toMinutes(seg.endTime);
      return startM >= s && endM <= e;
    });

    if (!fits) {
      throw new BadRequestException('Horário fora da agenda do profissional');
    }
  }

  private async assertNoOverlap(
    professionalId: string,
    startAt: Date,
    endAt: Date,
    ignoreId?: string,
  ) {
    const filter: FilterQuery<AppointmentDocument> = {
      professionalId: new Types.ObjectId(professionalId),
      status: AppointmentStatus.SCHEDULED,
      $or: [
        { startAt: { $lt: endAt }, endAt: { $gt: startAt } }, // intervalo sobreposto
      ],
    };
    if (ignoreId) filter._id = { $ne: new Types.ObjectId(ignoreId) };

    const exists = await this.apptModel.findOne(filter).lean().exec();
    if (exists) throw new BadRequestException('Horário já reservado');
  }

  // ---- create ----
  async createForUser(userId: string, dto: CreateAppointmentDto) {
    const professional = await this.getActiveProfessional(dto.professionalId);
    const service = await this.getActiveService(dto.serviceId);

    // (opcional) validar se o profissional oferece esse serviço:
    if (
      professional.serviceIds?.length &&
      !professional.serviceIds.some(s => s.toString() === dto.serviceId)
    ) {
      throw new BadRequestException('Este profissional não oferece o serviço selecionado');
    }

    const startAt = new Date(dto.startAtISO);
    if (isNaN(startAt.getTime())) throw new BadRequestException('Data/hora inválida');

    const now = new Date();
    if (startAt < now) throw new BadRequestException('Não é possível agendar no passado');

    const duration = service.durationInMinutes ?? 60;
    const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

    await this.assertWithinSchedule(dto.professionalId, startAt, endAt);
    await this.assertNoOverlap(dto.professionalId, startAt, endAt);

    const created = await this.apptModel.create({
      userId: new Types.ObjectId(userId),
      professionalId: new Types.ObjectId(dto.professionalId),
      serviceId: new Types.ObjectId(dto.serviceId),
      startAt,
      endAt,
      status: AppointmentStatus.SCHEDULED,
      notes: dto.notes,
    });

    return created;
  }

  // ---- cancel/complete ----
  async cancel(
    id: string,
    requesterUserId: string,
    isAdminOrProfessional: boolean,
    reason?: string,
  ) {
    const appt = await this.apptModel.findById(id).exec();
    if (!appt) throw new NotFoundException('Agendamento não encontrado');
    if (appt.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Somente agendamentos pendentes podem ser cancelados');
    }

    // Política simples: cliente pode cancelar seu próprio; admin/prof pode cancelar qualquer
    if (!isAdminOrProfessional && appt.userId.toString() !== requesterUserId) {
      throw new ForbiddenException('Sem permissão para cancelar este agendamento');
    }

    appt.status = AppointmentStatus.CANCELED;
    if (reason) appt.cancelReason = reason;
    await appt.save();
    return appt;
  }

  async complete(id: string, requesterIsProfessionalOrAdmin: boolean) {
    const appt = await this.apptModel.findById(id).exec();
    if (!appt) throw new NotFoundException('Agendamento não encontrado');
    if (appt.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Somente agendamentos pendentes podem ser concluídos');
    }
    if (!requesterIsProfessionalOrAdmin) {
      throw new ForbiddenException('Somente profissional/admin pode concluir');
    }
    appt.status = AppointmentStatus.COMPLETED;
    await appt.save();
    return appt;
  }

  // ---- reschedule ----
  async reschedule(
    id: string,
    requesterUserId: string,
    isAdminOrProfessional: boolean,
    dto: RescheduleAppointmentDto,
  ) {
    const appt = await this.apptModel.findById(id).exec();
    if (!appt) throw new NotFoundException('Agendamento não encontrado');
    if (appt.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Somente agendamentos pendentes podem ser remarcados');
    }
    if (!isAdminOrProfessional && appt.userId.toString() !== requesterUserId) {
      throw new ForbiddenException('Sem permissão para remarcar este agendamento');
    }

    const service = await this.getActiveService(dto.serviceId);
    const newStart = new Date(dto.newStartAtISO);
    if (isNaN(newStart.getTime())) throw new BadRequestException('Data/hora inválida');

    const now = new Date();
    if (newStart < now) throw new BadRequestException('Não é possível remarcar para o passado');

    const duration = service.durationInMinutes ?? 60;
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    await this.assertWithinSchedule(appt.professionalId.toString(), newStart, newEnd);
    await this.assertNoOverlap(appt.professionalId.toString(), newStart, newEnd, id);

    appt.serviceId = new Types.ObjectId(dto.serviceId);
    appt.startAt = newStart;
    appt.endAt = newEnd;
    await appt.save();
    return appt;
  }

  // ---- queries ----
  async list(query: QueryAppointmentsDto) {
    const { professionalId, userId, from, to, status, page = 1, limit = 10 } = query;
    const filter: FilterQuery<AppointmentDocument> = {};

    if (professionalId) filter.professionalId = new Types.ObjectId(professionalId);
    if (userId) filter.userId = new Types.ObjectId(userId);
    if (status) filter.status = status;
    if (from || to) {
      filter.startAt = {};
      if (from) filter.startAt.$gte = new Date(from);
      if (to) filter.startAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.apptModel.find(filter).sort({ startAt: 1 }).skip(skip).limit(limit).exec(),
      this.apptModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  async listForMe(userId: string, query: Omit<QueryAppointmentsDto, 'userId'>) {
    return this.list({ ...query, userId });
  }

  async listForMyProfessional(
    userId: string,
    query: Omit<QueryAppointmentsDto, 'professionalId' | 'userId'>,
  ) {
    // Descobrir professionalId a partir do userId
    const prof = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();
    if (!prof) throw new NotFoundException('Perfil de profissional não vinculado a este usuário');
    return this.list({ ...query, professionalId: prof._id.toString() });
  }

  // slots combinando agenda + agendamentos ocupados
  async dailySlots(professionalId: string, dateISO: string, slotMinutes = 60) {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) throw new BadRequestException('Data inválida');

    // 1) pegar segmentos ativos do dia
    const weekday = date.getDay();
    const segments = await this.scheduleModel
      .find({ professionalId, weekday, active: true })
      .sort({ startTime: 1 })
      .lean()
      .exec();

    // 2) gerar slots brutos
    const toMins = (h: number, m: number) => h * 60 + m;
    const slots: string[] = [];
    const toHHMM = (mins: number) =>
      `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

    for (const seg of segments) {
      const [sh, sm] = seg.startTime.split(':').map(Number);
      const [eh, em] = seg.endTime.split(':').map(Number);
      const s = toMins(sh, sm),
        e = toMins(eh, em);
      for (let t = s; t + slotMinutes <= e; t += slotMinutes) {
        slots.push(toHHMM(t));
      }
    }

    // 3) buscar agendamentos já ocupados naquele dia
    const startDay = new Date(date);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(date);
    endDay.setHours(23, 59, 59, 999);

    const booked = await this.apptModel
      .find({
        professionalId: new Types.ObjectId(professionalId),
        status: AppointmentStatus.SCHEDULED,
        startAt: { $gte: startDay, $lte: endDay },
      })
      .lean()
      .exec();

    const bookedHH = new Set(
      booked.map(
        b =>
          `${String(b.startAt.getHours()).padStart(2, '0')}:${String(b.startAt.getMinutes()).padStart(2, '0')}`,
      ),
    );

    // 4) remover slots ocupados (apenas por início igual)
    // (se você quiser bloquear também por duração, consulte overlaps como no create)
    const available = slots.filter(s => !bookedHH.has(s));
    return available;
  }
}
