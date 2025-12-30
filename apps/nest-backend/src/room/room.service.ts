import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';

@Injectable()
export class RoomService {
  constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

  async create(roomData: Partial<Room>): Promise<RoomDocument> {
    const createdRoom = new this.roomModel(roomData);
    return createdRoom.save();
  }

  async findAll(): Promise<RoomDocument[]> {
    return this.roomModel.find().exec();
  }

  async findById(id: string): Promise<RoomDocument | null> {
    return this.roomModel.findById(id).exec();
  }

  async findByRoomNumber(roomNumber: number): Promise<RoomDocument | null> {
    return this.roomModel.findOne({ roomNumber }).exec();
  }

  async update(roomNumber: number, updateData: Partial<Room>): Promise<RoomDocument | null> {
    return this.roomModel.findOneAndUpdate({ roomNumber }, updateData, { new: true }).exec();
  }

  async delete(roomNumber: number): Promise<RoomDocument | null> {
    return this.roomModel.findOneAndDelete({ roomNumber }).exec();
  }

  async addWordToRoom(roomId: string, word: string, similarity: number, user: any): Promise<RoomDocument | null> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      return null;
    }

    // Инициализируем Map, если его нет
    if (!room.linkingWords) {
      room.linkingWords = new Map();
    }

    // Добавляем новое слово в Map
    room.linkingWords.set(word, {
      similarity,
      user,
    });

    // Сохраняем комнату
    return room.save();
  }
}
