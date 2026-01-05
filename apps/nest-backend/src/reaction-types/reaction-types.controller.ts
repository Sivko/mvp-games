import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ReactionTypesService } from './reaction-types.service';

@Controller('reaction-types')
export class ReactionTypesController {
  constructor(private readonly reactionTypesService: ReactionTypesService) {}

  @Get()
  async findAll() {
    return this.reactionTypesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reactionTypesService.findOne(id);
  }

  @Post()
  async create(@Body() data: { name: string; image?: string | null; weight: number }) {
    return this.reactionTypesService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<{ name: string; image: string | null; weight: number }>) {
    return this.reactionTypesService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.reactionTypesService.delete(id);
  }
}

