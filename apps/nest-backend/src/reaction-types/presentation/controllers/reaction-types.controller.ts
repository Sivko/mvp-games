import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ReactionTypeApplicationService } from '../../application/services/reaction-type.application.service';
import { CreateReactionTypeDto } from '../../application/dto/create-reaction-type.dto';

@Controller('reaction-types')
export class ReactionTypesController {
  constructor(
    private readonly reactionTypeApplicationService: ReactionTypeApplicationService,
  ) {}

  @Get()
  async findAll() {
    return this.reactionTypeApplicationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reactionTypeApplicationService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateReactionTypeDto) {
    return this.reactionTypeApplicationService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateReactionTypeDto>,
  ) {
    return this.reactionTypeApplicationService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.reactionTypeApplicationService.delete(id);
    return { success: true };
  }
}
