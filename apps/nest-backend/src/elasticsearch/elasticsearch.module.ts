import { Module } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { ElasticsearchController } from './elasticsearch.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Answer, AnswerSchema } from '../answers/infrastructure/schemas/answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Answer', schema: AnswerSchema }]),
  ],
  controllers: [ElasticsearchController],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
