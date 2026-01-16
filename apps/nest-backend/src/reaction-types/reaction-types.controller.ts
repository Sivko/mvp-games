import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReactionTypesService } from './reaction-types.service';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

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
  @UseGuards(AdminAuthGuard)
  async create(
    @Body()
    data: {
      name: string;
      image?: string | null;
      textFromFinalRound?: string | null;
    },
  ) {
    return this.reactionTypesService.create(data);
  }

  @Put(':id')
  @UseGuards(AdminAuthGuard)
  async update(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      name: string;
      image: string | null;
      textFromFinalRound: string | null;
    }>,
  ) {
    return this.reactionTypesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async delete(@Param('id') id: string) {
    return this.reactionTypesService.delete(id);
  }
}
