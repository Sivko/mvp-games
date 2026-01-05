import { Controller, Get, Param } from '@nestjs/common';
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
}

