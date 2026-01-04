import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { join } from 'path';
import { RoomModule } from './room/room.module';
import { SearchWordService } from './games/search-word/search-word.service';
import { Room, RoomSchema } from './room/schemas/room.schema';
import { SettingsModule } from './settings/settings.module';
import { ReactionTypesModule } from './reaction-types/reaction-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Проверяем .env файл в корне проекта (относительно текущей рабочей директории)
      // и относительный путь от скомпилированного файла
      envFilePath: [
        join(`${process.cwd()}/../../.env`), // Корень проекта
      ],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: `mongodb://${configService.get('MDB_LOGIN')}:${configService.get('MDB_PASS')}@localhost:27017`,
        dbName: 'word-game',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    HttpModule,
    RoomModule,
    SettingsModule,
    ReactionTypesModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway, SearchWordService],
})
export class AppModule {}
