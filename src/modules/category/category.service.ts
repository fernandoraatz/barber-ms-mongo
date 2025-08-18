import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ProfessionalCategory, ProfessionalCategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Professional, ProfessionalDocument } from '../professional/schemas/professional.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(ProfessionalCategory.name)
    private readonly categoryModel: Model<ProfessionalCategoryDocument>,
    @InjectModel(Professional.name)
    private readonly professionalModel: Model<ProfessionalDocument>,
  ) {}

  async create(dto: CreateCategoryDto) {
    try {
      return await this.categoryModel.create(dto);
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }
      throw e;
    }
  }

  async findById(id: string) {
    const cat = await this.categoryModel.findById(id).exec();
    if (!cat) throw new NotFoundException('Categoria não encontrada');
    return cat;
  }

  async updateById(id: string, dto: UpdateCategoryDto) {
    try {
      const updated = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true }).exec();
      if (!updated) throw new NotFoundException('Categoria não encontrada');
      return updated;
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }
      throw e;
    }
  }

  async toggleStatus(id: string, active: boolean) {
    const updated = await this.categoryModel
      .findByIdAndUpdate(id, { status: active }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Categoria não encontrada');
    return updated;
  }

  async deleteById(id: string) {
    const inUse = await this.professionalModel.countDocuments({ categoryId: id }).exec();
    if (inUse > 0) {
      throw new ConflictException(
        'Categoria está em uso por profissionais; remova vínculos antes de excluir',
      );
    }
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Categoria não encontrada');
    return { ok: true };
  }

  async search(query: QueryCategoryDto) {
    const { q, status, page = 1, limit = 10 } = query;
    const filter: FilterQuery<ProfessionalCategoryDocument> = {};

    if (typeof status === 'boolean') filter.status = status;
    if (q) filter.$text = { $search: q };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.categoryModel.find(filter).skip(skip).limit(limit).exec(),
      this.categoryModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit };
  }
}
