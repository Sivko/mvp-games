import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { BankAssociationTextService } from './bank-association-text.service';
import { BankAssociationText } from './schemas/bank-association-text.schema';

@Controller('bank-association-text')
export class BankAssociationTextController {
  constructor(
    private readonly bankAssociationTextService: BankAssociationTextService,
  ) {}

  @Post()
  async create(@Body() createDto: Partial<BankAssociationText>) {
    return this.bankAssociationTextService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.bankAssociationTextService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bankAssociationTextService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<BankAssociationText>,
  ) {
    return this.bankAssociationTextService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.bankAssociationTextService.delete(id);
  }

  @Post(':id/variants')
  async addVariant(
    @Param('id') id: string,
    @Body() variant: { variant: string; score: number },
  ) {
    return this.bankAssociationTextService.addVariant(id, variant);
  }

  @Delete(':id/variants/:variantId')
  async removeVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
  ) {
    return this.bankAssociationTextService.removeVariant(id, variantId);
  }

  @Patch(':id/variants/:variantId')
  async updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() variant: { variant?: string; score?: number },
  ) {
    return this.bankAssociationTextService.updateVariant(id, variantId, variant);
  }
}

