import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { UserApplicationService } from '../../application/services/user.application.service';
import { CreateUserDto } from '../../application/dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userApplicationService: UserApplicationService,
  ) {}

  @Post('find-or-create')
  async findOrCreateUser(@Body() createUserDto: CreateUserDto) {
    const userId =
      await this.userApplicationService.findOrCreateUser(createUserDto);
    return { userId };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userApplicationService.findById(id);
  }

  @Get()
  async findAll() {
    return this.userApplicationService.findAll();
  }
}
