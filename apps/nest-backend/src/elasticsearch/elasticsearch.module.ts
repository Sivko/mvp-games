import { Module } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Answer, AnswerSchema } from '../answers/schemas/answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Answer.name, schema: AnswerSchema }]),
  ],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}

