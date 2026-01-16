import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { BankAssociationTextService } from './bank-association-text.service';
import { BankAssociationText } from './schemas/bank-association-text.schema';
import { ImportDataService } from './import-data.service';

@Controller('bank-association-text')
export class BankAssociationTextController {
  constructor(
    private readonly bankAssociationTextService: BankAssociationTextService,
    private readonly importDataService: ImportDataService,
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

  @Post('import')
  async importFromFile() {
    return this.importDataService.importFromFile();
  }
}
