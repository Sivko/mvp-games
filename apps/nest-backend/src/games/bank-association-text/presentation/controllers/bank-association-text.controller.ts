import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { BankAssociationTextApplicationService } from '../../application/services/bank-association-text.application.service';
import { CreateBankAssociationTextDto } from '../../application/dto/create-bank-association-text.dto';

@Controller('bank-association-text')
export class BankAssociationTextController {
  constructor(
    private readonly bankAssociationTextApplicationService: BankAssociationTextApplicationService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateBankAssociationTextDto) {
    return this.bankAssociationTextApplicationService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.bankAssociationTextApplicationService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.bankAssociationTextApplicationService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateBankAssociationTextDto>,
  ) {
    return this.bankAssociationTextApplicationService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.bankAssociationTextApplicationService.delete(id);
    return { success: true };
  }

  @Delete()
  async deleteAll() {
    return this.bankAssociationTextApplicationService.deleteAll();
  }
}
