import { Controller, Get, Post, Query } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';

@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  @Get('unique-words')
  async getUniqueWords(
    @Query('size') size?: string,
    @Query('bankAssociationTextId') bankAssociationTextId?: string,
  ) {
    const sizeNumber = size ? parseInt(size, 10) : 10000;
    return this.elasticsearchService.getUniqueWords(
      sizeNumber,
      bankAssociationTextId,
    );
  }

  @Post('initialize')
  async initialize() {
    await this.elasticsearchService.initialize();
    return { message: 'Elasticsearch index initialized successfully' };
  }
}

