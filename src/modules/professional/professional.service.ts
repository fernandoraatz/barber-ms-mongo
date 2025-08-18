import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  Professional,
  ProfessionalDocument,
  ProfessionalStatus,
} from './schemas/professional.schema';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { QueryProfessionalDto } from './dto/query-professional.dto';

@Injectable()
export class ProfessionalService {
  constructor(
    @InjectModel(Professional.name) private readonly professionalModel: Model<ProfessionalDocument>,
  ) {}

  async create(dto: CreateProfessionalDto) {
    const created = await this.professionalModel.create({
      ...dto,
      categoryId: new Types.ObjectId(dto.categoryId),
      serviceIds: (dto.serviceIds ?? []).map(id => new Types.ObjectId(id)),
    });
    return created;
  }

  async findById(id: string) {
    const prof = await this.professionalModel.findById(id).exec();
    if (!prof) throw new NotFoundException('Profissional não encontrado');
    return prof;
  }

  async updateById(id: string, dto: UpdateProfessionalDto) {
    const payload: any = { ...dto };
    if (dto.categoryId) payload.categoryId = new Types.ObjectId(dto.categoryId);
    if (dto.serviceIds) payload.serviceIds = dto.serviceIds.map(id => new Types.ObjectId(id));

    const updated = await this.professionalModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Profissional não encontrado');
    return updated;
  }

  async deleteById(id: string) {
    const deleted = await this.professionalModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Profissional não encontrado');
    return { ok: true };
  }

  async search(query: QueryProfessionalDto) {
    const { q, categoryId, status, page = 1, limit = 10 } = query;
    const filter: FilterQuery<ProfessionalDocument> = {};
    if (categoryId) filter.categoryId = new Types.ObjectId(categoryId);
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.professionalModel.find(filter).skip(skip).limit(limit).exec(),
      this.professionalModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }

  // ✅ Vincular um User a um Professional (feito por ADMIN)
  async assignUser(professionalId: string, userId: string) {
    // Verifica se já existe outro profissional com esse userId
    const already = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean()
      .exec();
    if (already && already._id.toString() !== professionalId) {
      throw new ConflictException('Este usuário já está vinculado a outro profissional');
    }

    const updated = await this.professionalModel
      .findByIdAndUpdate(professionalId, { userId: new Types.ObjectId(userId) }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Profissional não encontrado');
    return updated;
  }

  // ✅ Desvincular
  async unassignUser(professionalId: string) {
    const updated = await this.professionalModel
      .findByIdAndUpdate(professionalId, { $unset: { userId: '' } }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Profissional não encontrado');
    return updated;
  }

  // ✅ Recuperar o perfil do profissional logado
  async getMyProfile(userId: string) {
    const prof = await this.professionalModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!prof)
      throw new NotFoundException('Nenhum perfil de profissional vinculado a este usuário');
    return prof;
  }
}
