import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './infrastructure/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  /**
   * Находит или создает пользователя
   * @param userData - данные пользователя (может содержать name, telegramId и другие поля)
   * @returns ObjectId пользователя
   */
  async findOrCreateUser(userData: {
    name?: string;
    telegramId?: number;
    telegramUsername?: string;
    telegramFirstName?: string;
    telegramLastName?: string;
    telegramPhotoUrl?: string;
    telegramLanguageCode?: string;
  }): Promise<string> {
    // Если есть telegramId, ищем по нему
    if (userData.telegramId) {
      const existingUser = await this.userModel
        .findOne({ telegramId: userData.telegramId })
        .exec();
      if (existingUser) {
        return existingUser._id.toString();
      }
    }

    // Если есть name, ищем по нему (для простых пользователей без Telegram)
    if (userData.name) {
      const existingUser = await this.userModel
        .findOne({
          name: userData.name,
          telegramId: { $exists: false },
        })
        .exec();
      if (existingUser) {
        return existingUser._id.toString();
      }
    }

    // Создаем нового пользователя
    const newUser = new this.userModel({
      name: userData.name || userData.telegramFirstName || 'Неизвестный',
      telegramId: userData.telegramId,
      telegramUsername: userData.telegramUsername,
      telegramFirstName: userData.telegramFirstName,
      telegramLastName: userData.telegramLastName,
      telegramPhotoUrl: userData.telegramPhotoUrl,
      telegramLanguageCode: userData.telegramLanguageCode,
    });

    const savedUser = await newUser.save();
    return savedUser._id.toString();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }
}
