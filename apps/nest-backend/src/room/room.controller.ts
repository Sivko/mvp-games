import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RoomService } from './room.service';
import { Room } from './schemas/room.schema';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async findAll() {
    return this.roomService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.roomService.findById(id);
  }

  @Post()
  async create(@Body() createRoomDto: Partial<Room>) {
    return this.roomService.create(createRoomDto);
  }
}
