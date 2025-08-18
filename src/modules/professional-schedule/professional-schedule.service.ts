import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProfessionalSchedule,
  ProfessionalScheduleDocument,
} from './schemas/professional-schedule.schema';
import { CreateScheduleSegmentDto } from './dto/create-segment.dto';
import { UpdateScheduleSegmentDto } from './dto/update-segment.dto';
import { QuerySlotsDto } from './dto/query-segment.dto';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
function hasOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

@Injectable()
export class ProfessionalScheduleService {
  constructor(
    @InjectModel(ProfessionalSchedule.name)
    private readonly scheduleModel: Model<ProfessionalScheduleDocument>,
  ) {}

  private validateTimes(startTime: string, endTime: string) {
    const s = toMinutes(startTime);
    const e = toMinutes(endTime);
    if (s >= e) throw new BadRequestException('startTime deve ser menor que endTime');
    return { s, e };
  }

  private async ensureNoOverlap(
    professionalId: string,
    weekday: number,
    startTime: string,
    endTime: string,
    ignoreId?: string,
  ) {
    const { s, e } = this.validateTimes(startTime, endTime);

    const existing = await this.scheduleModel.find({ professionalId, weekday }).lean().exec();
    for (const seg of existing) {
      if (ignoreId && seg._id.toString() === ignoreId) continue;
      const es = toMinutes(seg.startTime);
      const ee = toMinutes(seg.endTime);
      if (hasOverlap(s, e, es, ee)) {
        throw new BadRequestException(
          `Conflito com segmento existente ${seg.startTime}-${seg.endTime}`,
        );
      }
    }
  }

  // CRUD (ADMIN) — para criar segmentos para qualquer profissional
  async create(dto: CreateScheduleSegmentDto) {
    await this.ensureNoOverlap(dto.professionalId, dto.weekday, dto.startTime, dto.endTime);
    return this.scheduleModel.create({
      professionalId: new Types.ObjectId(dto.professionalId),
      weekday: dto.weekday,
      startTime: dto.startTime,
      endTime: dto.endTime,
      active: dto.active ?? true,
    });
  }

  async findAllByProfessional(professionalId: string) {
    return this.scheduleModel.find({ professionalId }).sort({ weekday: 1, startTime: 1 }).exec();
  }

  async update(id: string, dto: UpdateScheduleSegmentDto) {
    const seg = await this.scheduleModel.findById(id).exec();
    if (!seg) throw new NotFoundException('Segmento não encontrado');

    const professionalId = seg.professionalId.toString();
    const weekday = dto.weekday ?? seg.weekday;
    const startTime = dto.startTime ?? seg.startTime;
    const endTime = dto.endTime ?? seg.endTime;

    await this.ensureNoOverlap(professionalId, weekday, startTime, endTime, id);

    seg.weekday = weekday;
    seg.startTime = startTime;
    seg.endTime = endTime;
    if (dto.active !== undefined) seg.active = dto.active;

    await seg.save();
    return seg;
  }

  async remove(id: string) {
    const deleted = await this.scheduleModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Segmento não encontrado');
    return { ok: true };
  }

  // "Meus" segmentos (PROFESSIONAL) — passando professionalId já vinculado ao user
  async createForMe(professionalId: string, weekday: number, startTime: string, endTime: string) {
    await this.ensureNoOverlap(professionalId, weekday, startTime, endTime);
    return this.scheduleModel.create({
      professionalId: new Types.ObjectId(professionalId),
      weekday,
      startTime,
      endTime,
      active: true,
    });
  }

  async mySegments(professionalId: string) {
    return this.findAllByProfessional(professionalId);
  }

  // Slots diários (sem considerar agendamentos ainda; Appointments fará o filtro dos já ocupados)
  async dailySlots(professionalId: string, query: QuerySlotsDto, timezone = 'America/Sao_Paulo') {
    const slotMinutes = query.slotMinutes ?? 60;

    // Descobrir weekday da data
    const date = new Date(query.date);
    // Ajuste simples: usamos getUTCDay/getDay conforme necessidade; para simplicidade:
    const weekday = date.getDay(); // 0..6

    // Buscar segmentos ativos
    const segments = await this.scheduleModel
      .find({ professionalId, weekday, active: true })
      .sort({ startTime: 1 })
      .lean()
      .exec();

    const slots: string[] = [];
    for (const seg of segments) {
      const s = toMinutes(seg.startTime);
      const e = toMinutes(seg.endTime);
      for (let t = s; t + slotMinutes <= e; t += slotMinutes) {
        slots.push(toHHMM(t));
      }
    }

    // Filtrar slots no passado se a data é "hoje"
    if (query.skipPast === 'true') {
      const now = new Date();
      const isSameDay =
        now.toISOString().slice(0, 10) === new Date(query.date).toISOString().slice(0, 10);
      if (isSameDay) {
        const currentMins = now.getHours() * 60 + now.getMinutes();
        return slots.filter(h => toMinutes(h) > currentMins);
      }
    }

    return slots;
  }
}
