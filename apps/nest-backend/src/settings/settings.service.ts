import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
  ) {}

  async getSettings(): Promise<SettingsDocument> {
    // Получаем настройки или создаем дефолтные, если их нет
    let settings = await this.settingsModel.findOne().exec();
    
    if (!settings) {
      settings = new this.settingsModel({
        searchWords: ['нос', 'машина'],
        associationWords: ['нос', 'машина'],
      });
      await settings.save();
    }
    
    return settings;
  }

  async updateSettings(updateData: Partial<Settings>): Promise<SettingsDocument> {
    let settings = await this.settingsModel.findOne().exec();
    
    if (!settings) {
      settings = new this.settingsModel(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    
    return settings.save();
  }
}
