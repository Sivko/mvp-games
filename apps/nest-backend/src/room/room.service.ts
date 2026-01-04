import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';

@Injectable()
export class RoomService {
  constructor(@InjectModel(Room.name) private roomModel: Model<RoomDocument>) {}

  async create(roomData: Partial<Room>): Promise<RoomDocument> {
    // Преобразуем старый формат в новый, если searchWord не передан
    if (!roomData.searchWord) {
      const searchWordData: any = {
        linkingWords: new Map(),
        status: 'waiting',
        gamesCount: 0,
        sourceWord: (roomData as any).sourceWord || '',
        blackListWord: [],
      };
      
      // Если есть linkingWords в старом формате, переносим их
      if ((roomData as any).linkingWords) {
        searchWordData.linkingWords = (roomData as any).linkingWords;
      }
      
      // Если есть другие поля старого формата, переносим их
      if ((roomData as any).status) {
        searchWordData.status = (roomData as any).status;
      }
      if ((roomData as any).gamesCount !== undefined) {
        searchWordData.gamesCount = (roomData as any).gamesCount;
      }
      if ((roomData as any).blackListWord) {
        searchWordData.blackListWord = (roomData as any).blackListWord;
      }
      
      roomData.searchWord = searchWordData;
      
      // Удаляем старые поля
      delete (roomData as any).sourceWord;
      delete (roomData as any).linkingWords;
      delete (roomData as any).status;
      delete (roomData as any).gamesCount;
      delete (roomData as any).blackListWord;
    }
    
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
}
