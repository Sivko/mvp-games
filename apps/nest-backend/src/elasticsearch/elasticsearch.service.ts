import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '@elastic/elasticsearch';
import { Answer, AnswerDocument } from '../answers/schemas/answer.schema';

export interface WordCount {
  text: string;
  count: number;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;
  private readonly indexName = 'popularanswers';

  constructor(
    private configService: ConfigService,
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
  ) {
    const elasticsearchUrl =
      this.configService.get<string>('ELASTICSEARCH_URL') ||
      'http://localhost:9200';

    this.client = new Client({
      node: elasticsearchUrl,
    });
  }

  async onModuleInit() {
    // Можно вызвать инициализацию при старте приложения, если нужно
    // await this.initialize();
  }

  /**
   * Метод инициализации:
   * - Удаляет индекс "popularanswers"
   * - Сохраняет все answers из MongoDB (только поля text и bankAssociationTextId)
   * - Настраивает индекс для text: русские синонимы, корень слова, фуззи 1
   */
  async initialize(): Promise<void> {
    try {
      // Удаляем индекс, если он существует
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (indexExists) {
        await this.client.indices.delete({
          index: this.indexName,
        });
        this.logger.log(`Индекс ${this.indexName} удален`);
      }

      // Создаем индекс с настройками для русского языка
      await this.client.indices.create({
        index: this.indexName,
        settings: {
          analysis: {
            analyzer: {
              russian_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: [
                  'lowercase',
                  'russian_stop',
                  'russian_stemmer',
                  'russian_synonyms',
                ],
              },
            },
            filter: {
              russian_stop: {
                type: 'stop',
                stopwords: '_russian_',
              },
              russian_stemmer: {
                type: 'stemmer',
                language: 'russian',
              },
              russian_synonyms: {
                type: 'synonym',
                synonyms: [
                  // Можно добавить свои синонимы здесь
                  // Например: 'автомобиль,машина,авто',
                ],
              },
            },
          },
        },
        mappings: {
          properties: {
            text: {
              type: 'keyword', // Исходное значение как keyword для получения точного текста
            },
            elastiText: {
              type: 'text',
              analyzer: 'russian_analyzer',
              fielddata: true, // Включаем fielddata для агрегаций по токенам
              fields: {
                fuzzy: {
                  type: 'text',
                  analyzer: 'russian_analyzer',
                },
              },
            },
            bankAssociationTextId: {
              type: 'keyword',
            },
          },
        },
      });

      this.logger.log(`Индекс ${this.indexName} создан с настройками для русского языка`);

      // Получаем все answers из MongoDB
      const answers = await this.answerModel.find({}).exec();

      if (answers.length === 0) {
        this.logger.warn('Нет данных для индексации');
        return;
      }

      // Индексируем данные батчами
      const batchSize = 1000;
      let indexedCount = 0;

      for (let i = 0; i < answers.length; i += batchSize) {
        const batch = answers.slice(i, i + batchSize);
        const body = batch.flatMap((answer) => [
          {
            index: {
              _index: this.indexName,
              _id: answer._id.toString(),
            },
          },
          {
            text: answer.text, // Исходное значение
            elastiText: answer.text, // Анализируемое значение для агрегации
            bankAssociationTextId: answer.bankAssociationTextId
              ? answer.bankAssociationTextId.toString()
              : null,
          },
        ]);

        await this.client.bulk({
          refresh: i + batchSize >= answers.length ? 'wait_for' : false,
          body,
        });

        indexedCount += batch.length;
        this.logger.log(
          `Индексировано ${indexedCount} из ${answers.length} ответов`,
        );
      }

      this.logger.log(
        `Успешно индексировано ${answers.length} ответов в Elasticsearch`,
      );
    } catch (error) {
      this.logger.error(`Ошибка при инициализации Elasticsearch: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Метод подсчета:
   * Получает "text" и "bankAssociationTextId", делает подсчет найденных результатов
   * с фильтром bankAssociationTextId=bankAssociationTextId (строгая проверка)
   * и text (не строгая проверка с fuzzy)
   */
  async count(
    text: string,
    bankAssociationTextId: string,
  ): Promise<number> {
    try {
      const query: any = {
        bool: {
          must: [
            // Строгая проверка bankAssociationTextId
            {
              term: {
                bankAssociationTextId: bankAssociationTextId,
              },
            },
            // Не строгая проверка elastiText с fuzzy
            {
              match: {
                elastiText: {
                  query: text,
                  fuzziness: 1,
                },
              },
            },
          ],
        },
      };

      const response = await this.client.count({
        index: this.indexName,
        query,
      });

      return response.count;
    } catch (error) {
      this.logger.error(`Ошибка при подсчете в Elasticsearch: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Получает уникальный список слов из индекса с подсчетом их использования
   * Слова приводятся к базовой форме благодаря русскому стеммеру
   * @param size - максимальное количество уникальных слов (по умолчанию 10000)
   * @param bankAssociationTextId - опциональный фильтр по bankAssociationTextId (строгая проверка)
   * @returns массив объектов {text: string, count: number}
   */
  async getUniqueWords(
    size: number = 10000,
    bankAssociationTextId?: string,
  ): Promise<WordCount[]> {
    try {
      const query: any = {};

      // Добавляем фильтр по bankAssociationTextId, если он передан
      if (bankAssociationTextId) {
        query.bool = {
          must: [
            {
              term: {
                bankAssociationTextId: bankAssociationTextId,
              },
            },
          ],
        };
      }

      const response = await this.client.search({
        index: this.indexName,
        size: 0, // Не возвращаем документы, только агрегации
        ...(Object.keys(query).length > 0 && { query }),
        aggs: {
          unique_words: {
            terms: {
              field: 'elastiText', // Используем elastiText для агрегации
              size: size,
              order: {
                _count: 'desc', // Сортировка по количеству (от большего к меньшему)
              },
            },
            aggs: {
              // Вложенная агрегация для получения первого исходного документа
              top_text_hits: {
                top_hits: {
                  size: 1, // Берем только первый документ
                  _source: {
                    includes: ['text'], // Получаем только поле text из исходного документа
                  },
                },
              },
            },
          },
        },
      });

      const buckets = (response.aggregations?.unique_words as any)?.buckets || [];

      // Используем Map для дедупликации по исходному тексту
      const uniqueTextsMap = new Map<string, number>();

      buckets.forEach((bucket: any) => {
        // Получаем первый исходный текст из top_hits
        const topHit = bucket.top_text_hits?.hits?.hits?.[0];
        const originalText = topHit?._source?.text || bucket.key;

        // Если текст уже есть, суммируем счетчики
        const currentCount = uniqueTextsMap.get(originalText) || 0;
        uniqueTextsMap.set(originalText, currentCount + bucket.doc_count);
      });

      // Преобразуем Map в массив и сортируем по убыванию count
      return Array.from(uniqueTextsMap.entries())
        .map(([text, count]) => ({
          text,
          count,
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      this.logger.error(
        `Ошибка при получении уникальных слов из Elasticsearch: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Подсчитывает score для ответа на основе его популярности среди топ-20 вариантов
   * @param bankAssociationTextId - ID вопроса из банка
   * @param text - текст ответа
   * @param answerId - ID ответа (не используется, но может быть полезен для логирования)
   * @returns объект с score (процент от 0 до 100)
   */
  async calculateScore(
    bankAssociationTextId: string,
    text: string,
    answerId?: string,
  ): Promise<{ score: number }> {
    try {
      // Получаем топ-20 уникальных слов для данного bankAssociationTextId
      const top20 = await this.getUniqueWords(20, bankAssociationTextId);

      if (top20.length === 0) {
        return { score: 0 };
      }

      // Ищем текущий текст в топ-20
      const currentItem = top20.find((item) => item.text === text);

      if (!currentItem) {
        return { score: 0 };
      }

      // Вычисляем общую сумму count для топ-20
      const totalCount = top20.reduce((sum, item) => sum + item.count, 0);

      if (totalCount === 0) {
        return { score: 0 };
      }

      // Вычисляем процент текущего count от общего
      const countPercent = (currentItem.count / totalCount) * 100;
      const finalScore = Math.round(countPercent * 100) / 100; // Округляем до 2 знаков после запятой

      // Если указан answerId, обновляем запись в БД
      if (answerId) {
        try {
          await this.answerModel.findByIdAndUpdate(
            answerId,
            { score: finalScore },
            { new: true },
          ).exec();
          this.logger.log(`Score ${finalScore} сохранен для answerId: ${answerId}`);
        } catch (dbError) {
          this.logger.warn(
            `Не удалось сохранить score в БД для answerId ${answerId}: ${dbError.message}`,
          );
          // Продолжаем выполнение, даже если не удалось сохранить в БД
        }
      }

      return { score: finalScore };
    } catch (error) {
      this.logger.error(
        `Ошибка при подсчете score: ${error.message}`,
        error.stack,
      );
      // В случае ошибки возвращаем score: 0
      return { score: 0 };
    }
  }
}
