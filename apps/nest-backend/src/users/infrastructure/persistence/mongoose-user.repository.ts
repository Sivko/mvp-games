import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id).exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    const doc = await this.userModel.findOne({ telegramId }).exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findByName(name: string): Promise<User | null> {
    const doc = await this.userModel
      .findOne({
        name,
        telegramId: { $exists: false },
      })
      .exec();
    if (!doc) {
      return null;
    }
    return this.toDomain(doc);
  }

  async findAll(): Promise<User[]> {
    const docs = await this.userModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async save(user: User): Promise<User> {
    const userData: any = {
      name: user.name,
    };

    if (user.telegramUser) {
      const telegram = user.telegramUser.toObject();
      userData.telegramId = telegram.telegramId;
      userData.telegramUsername = telegram.telegramUsername;
      userData.telegramFirstName = telegram.telegramFirstName;
      userData.telegramLastName = telegram.telegramLastName;
      userData.telegramPhotoUrl = telegram.telegramPhotoUrl;
      userData.telegramLanguageCode = telegram.telegramLanguageCode;
    }

    if (user.id) {
      const updated = await this.userModel
        .findByIdAndUpdate(user.id, userData, { new: true })
        .exec();
      if (!updated) {
        throw new Error(`User with ID ${user.id} not found`);
      }
      return this.toDomain(updated);
    } else {
      const created = new this.userModel(userData);
      const saved = await created.save();
      return this.toDomain(saved);
    }
  }

  private toDomain(doc: UserDocument): User {
    return User.reconstitute(
      doc._id.toString(),
      doc.name,
      doc.telegramId,
      doc.telegramUsername,
      doc.telegramFirstName,
      doc.telegramLastName,
      doc.telegramPhotoUrl,
      doc.telegramLanguageCode,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
