import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './infrastructure/schemas/user.schema';
import { UsersController } from './presentation/controllers/users.controller';
import { UserApplicationService } from './application/services/user.application.service';
import { MongooseUserRepository } from './infrastructure/persistence/mongoose-user.repository';
import { UsersService } from './users.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  controllers: [UsersController],
  providers: [
    UserApplicationService,
    UsersService,
    {
      provide: 'IUserRepository',
      useClass: MongooseUserRepository,
    },
  ],
  exports: [
    UserApplicationService,
    UsersService,
    'IUserRepository',
    MongooseModule,
  ],
})
export class UsersModule {}
