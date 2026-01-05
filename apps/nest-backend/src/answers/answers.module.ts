import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Answer, AnswerSchema } from './schemas/answer.schema';
import { AnswersService } from './answers.service';
import { AnswersController } from './answers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Answer.name, schema: AnswerSchema }]),
  ],
  controllers: [AnswersController],
  providers: [AnswersService],
  exports: [AnswersService, MongooseModule],
})
export class AnswersModule {}

