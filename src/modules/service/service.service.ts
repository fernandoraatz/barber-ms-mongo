import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto ';
import { QueryServiceDto } from './dto/query-service.dto';
import { Professional, ProfessionalDocument } from '../professional/schemas/professional.schema';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
    @InjectModel(Professional.name) private readonly professionalModel: Model<ProfessionalDocument>,
  ) {}

  async create(dto: CreateServiceDto) {
    const created = await this.serviceModel.create(dto);
    return created;
  }

  async findById(id: string) {
    const item = await this.serviceModel.findById(id).exec();
    if (!item) throw new NotFoundException('Serviço não encontrado');
    return item;
  }

  async updateById(id: string, dto: UpdateServiceDto) {
    const updated = await this.serviceModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Serviço não encontrado');
    return updated;
  }

  async toggleStatus(id: string, active: boolean) {
    const updated = await this.serviceModel
      .findByIdAndUpdate(id, { status: active }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Serviço não encontrado');
    return updated;
  }

  async deleteById(id: string) {
    const inUse = await this.professionalModel.countDocuments({ serviceIds: id }).exec();
    if (inUse > 0) {
      throw new ConflictException(
        'Serviço está vinculado a profissionais; remova vínculos antes de excluir',
      );
    }
    const deleted = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Serviço não encontrado');
    return { ok: true };
  }

  async search(query: QueryServiceDto) {
    const { q, minPrice, maxPrice, status, page = 1, limit = 10 } = query;
    const filter: FilterQuery<ServiceDocument> = {};

    if (typeof status === 'boolean') filter.status = status;
    if (typeof minPrice === 'number' || typeof maxPrice === 'number') {
      filter.price = {};
      if (typeof minPrice === 'number') filter.price.$gte = minPrice;
      if (typeof maxPrice === 'number') filter.price.$lte = maxPrice;
    }
    if (q) filter.$text = { $search: q };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.serviceModel.find(filter).skip(skip).limit(limit).exec(),
      this.serviceModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }
}
