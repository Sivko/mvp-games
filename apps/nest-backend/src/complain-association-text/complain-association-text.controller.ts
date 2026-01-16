import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ComplainAssociationTextService } from './complain-association-text.service';
import { ComplainAssociationText } from './schemas/complain-association-text.schema';

@Controller('complain-association-text')
export class ComplainAssociationTextController {
  constructor(
    private readonly complainAssociationTextService: ComplainAssociationTextService,
  ) {}

  @Post()
  async create(@Body() createDto: Partial<ComplainAssociationText>) {
    return this.complainAssociationTextService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.complainAssociationTextService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.complainAssociationTextService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<ComplainAssociationText>,
  ) {
    return this.complainAssociationTextService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.complainAssociationTextService.delete(id);
  }
}
