import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScheduleSettings, ScheduleSettingsDocument } from './schemas/schedule-settings';
import { ScheduleBlackout, ScheduleBlackoutDocument } from './schemas/schedule-blackouts';
import { UpsertSettingsDto } from './dto/upsert-settings.dto';
import { CreateBlackoutDto } from './dto/create-blackout.dto';
import { MonthAvailabilityDto } from './dto/month-availability.dto';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from '../appointment/schemas/appointment.schema';

const TZ_OFFSET_MIN = 180; // America/Sao_Paulo UTC-03 (sem DST)
const pad2 = (n: number) => String(n).padStart(2, '0');

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(mins: number) {
  return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
}

// Constrói Date UTC correspondente à meia-noite local (UTC-03) do dia informado
function localDayToUTC(year: number, month1: number, day: number) {
  // 00:00 local => 03:00 UTC
  return new Date(Date.UTC(year, month1 - 1, day, 3, 0, 0, 0));
}
function utcRangeForLocalDay(year: number, month1: number, day: number) {
  const start = new Date(Date.UTC(year, month1 - 1, day, 3, 0, 0, 0));
  const end = new Date(Date.UTC(year, month1 - 1, day + 1, 2, 59, 59, 999));
  return { start, end };
}
// Converte Date UTC para "HH:mm" local (UTC-03)
function toLocalHHMM(d: Date) {
  const h = (d.getUTCHours() - 3 + 24) % 24;
  const m = d.getUTCMinutes();
  return `${pad2(h)}:${pad2(m)}`;
}
function todayLocalYMD() {
  const now = new Date();
  // converte para "agora" em -03 sem libs
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  // nowUTC hh:mm -> local = hh-3
  let hh = now.getUTCHours() - 3;
  let dd = d;
  const mm = m;
  const yy = y;
  if (hh < 0) {
    hh += 24;
    dd -= 1;
  }
  // ajuste de virada simples (suficiente para nosso caso)
  const dt = new Date(Date.UTC(yy, mm - 1, dd, hh, now.getUTCMinutes(), 0, 0));
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    hh: dt.getUTCHours(),
    mm: dt.getUTCMinutes(),
    key: `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`,
  };
}

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(ScheduleSettings.name)
    private readonly settingsModel: Model<ScheduleSettingsDocument>,
    @InjectModel(ScheduleBlackout.name)
    private readonly blackoutModel: Model<ScheduleBlackoutDocument>,
    @InjectModel(Appointment.name) private readonly apptModel: Model<AppointmentDocument>,
  ) {}

  // -------- Settings (ADMIN) --------
  async upsertSettings(professionalId: string, dto: UpsertSettingsDto) {
    if (toMinutes(dto.startTime) >= toMinutes(dto.endTime)) {
      throw new BadRequestException('startTime deve ser menor que endTime');
    }
    const workingDays = dto.workingDays?.length ? dto.workingDays : [1, 2, 3, 4, 5, 6];

    // valida breaks
    const breaks = (dto.breaks ?? []).map(b => {
      if (!b?.start || !b?.end) throw new BadRequestException('breaks inválidos');
      const s = toMinutes(b.start),
        e = toMinutes(b.end);
      if (s >= e) throw new BadRequestException(`break inválido ${b.start}-${b.end}`);
      // não pode sair do range de trabalho
      const ws = toMinutes(dto.startTime),
        we = toMinutes(dto.endTime);
      if (s < ws || e > we)
        throw new BadRequestException(`break fora do expediente: ${b.start}-${b.end}`);
      return { start: b.start, end: b.end };
    });

    return this.settingsModel
      .findOneAndUpdate(
        { professionalId: new Types.ObjectId(professionalId) },
        {
          professionalId: new Types.ObjectId(professionalId),
          startTime: dto.startTime,
          endTime: dto.endTime,
          breaks,
          workingDays,
        },
        { new: true, upsert: true },
      )
      .exec();
  }

  async getSettings(professionalId: string) {
    const s = await this.settingsModel.findOne({ professionalId }).lean().exec();
    if (!s) throw new NotFoundException('Configuração de agenda não encontrada');
    return s;
  }

  // -------- Blackouts (ADMIN) --------
  async createBlackout(dto: CreateBlackoutDto, createdBy?: string) {
    const [y, m, d] = dto.dayISO.slice(0, 10).split('-').map(Number);
    const day = localDayToUTC(y, m, d);

    if (toMinutes(dto.startTime) >= toMinutes(dto.endTime)) {
      throw new BadRequestException('startTime deve ser menor que endTime');
    }

    return this.blackoutModel.create({
      professionalId: new Types.ObjectId(dto.professionalId),
      day,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason,
      createdBy,
    });
  }
  async removeBlackout(id: string) {
    const del = await this.blackoutModel.findByIdAndDelete(id).exec();
    if (!del) throw new NotFoundException('Bloqueio não encontrado');
    return { ok: true };
  }

  // -------- Geração de slots (DAY) --------
  private buildDailySlotsFromSettings(
    startTime: string,
    endTime: string,
    breaks: { start: string; end: string }[],
    slotMinutes = 60,
  ) {
    // converte breaks em "intervalos válidos" (start->break1.start), (break1.end->break2.start), ... -> end
    const segments: Array<{ s: number; e: number }> = [];
    const ws = toMinutes(startTime);
    const we = toMinutes(endTime);

    const ordered = [...breaks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    let cursor = ws;
    for (const b of ordered) {
      const bs = toMinutes(b.start),
        be = toMinutes(b.end);
      if (bs > cursor) segments.push({ s: cursor, e: bs });
      cursor = Math.max(cursor, be);
    }
    if (cursor < we) segments.push({ s: cursor, e: we });

    const slots: string[] = [];
    for (const seg of segments) {
      for (let t = seg.s; t + slotMinutes <= seg.e; t += slotMinutes) {
        slots.push(toHHMM(t));
      }
    }
    return slots;
  }

  async daySlots(professionalId: string, dateYMD: string) {
    // valida e carrega settings
    const settings = await this.getSettings(professionalId);
    const [y, m, d] = dateYMD.slice(0, 10).split('-').map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d, 3)).getUTCDay(); // 0=dom ... 6=sáb, ajustado p/ -03

    // domingo: sem slots
    if (!settings.workingDays.includes(weekday)) return [];

    let slots = this.buildDailySlotsFromSettings(
      settings.startTime,
      settings.endTime,
      settings.breaks,
      60,
    );

    // remove horários passados se hoje
    const today = todayLocalYMD();
    if (today.key === `${y}-${pad2(m)}-${pad2(d)}`) {
      const nowMins = today.hh * 60 + today.mm;
      slots = slots.filter(h => toMinutes(h) > nowMins);
    }

    // aplica blackouts do dia
    const dayUTC = localDayToUTC(y, m, d);
    const blackouts = await this.blackoutModel.find({ professionalId, day: dayUTC }).lean().exec();
    if (blackouts.length) {
      slots = slots.filter(hh => {
        const t = toMinutes(hh);
        return !blackouts.some(b => t >= toMinutes(b.startTime) && t < toMinutes(b.endTime));
      });
    }

    // remove horários já agendados (Appointments SCHEDULED)
    const range = utcRangeForLocalDay(y, m, d);
    const appts = await this.apptModel
      .find({
        professionalId: new Types.ObjectId(professionalId),
        status: AppointmentStatus.SCHEDULED,
        startAt: { $gte: range.start, $lte: range.end },
      })
      .lean()
      .exec();

    const booked = new Set(appts.map(a => toLocalHHMM(new Date(a.startAt))));
    slots = slots.filter(h => !booked.has(h));

    return slots;
  }

  // -------- Disponibilidade do mês --------
  async monthAvailability(professionalId: string, q: MonthAvailabilityDto) {
    const today = todayLocalYMD();
    const year = q.year ?? today.year;
    const month = q.month ?? today.month;
    const includeSlots = q.includeSlots === 'true';

    // garante que existem settings
    const settings = await this.getSettings(professionalId);

    const daysInMonth = new Date(year, month, 0).getDate();
    const out: Array<{ date: string; slots: string[] }> = [];

    for (
      let day = year === today.year && month === today.month ? today.day : 1;
      day <= daysInMonth;
      day++
    ) {
      const key = `${year}-${pad2(month)}-${pad2(day)}`;
      const weekday = new Date(Date.UTC(year, month - 1, day, 3)).getUTCDay();
      // domingo fora
      if (!settings.workingDays.includes(weekday)) {
        out.push({ date: key, slots: [] });
        continue;
      }
      const slots = await this.daySlots(professionalId, key);
      out.push({ date: key, slots: includeSlots ? slots : slots.length ? ['AVAILABLE'] : [] });
    }

    return out;
  }
}
