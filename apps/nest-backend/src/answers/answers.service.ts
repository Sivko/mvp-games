import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Answer, AnswerDocument } from './schemas/answer.schema';
import { Game, GameDocument } from '../games/game.schema';

@Injectable()
export class AnswersService {
  constructor(
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
  ) {}

  async create(createDto: {
    gameId: string;
    userId: string;
    text: string;
    bankAssociationTextId?: string;
  }): Promise<AnswerDocument> {
    const created = new this.answerModel({
      gameId: createDto.gameId as any,
      user: createDto.userId as any,
      text: createDto.text,
      ...(createDto.bankAssociationTextId && {
        bankAssociationTextId: createDto.bankAssociationTextId as any,
      }),
    });
    return created.save();
  }

  async findByGameId(gameId: string): Promise<AnswerDocument[]> {
    return this.answerModel.find({ gameId: gameId as any }).exec();
  }

  async findByGameIdAndUserId(
    gameId: string,
    userId: string,
  ): Promise<AnswerDocument | null> {
    return this.answerModel
      .findOne({
        gameId: gameId as any,
        user: userId as any,
      })
      .exec();
  }

  async findById(id: string): Promise<AnswerDocument | null> {
    return this.answerModel.findById(id).exec();
  }

  async deleteByGameId(gameId: string): Promise<void> {
    await this.answerModel.deleteMany({ gameId: gameId as any }).exec();
  }

  /**
   * Получает ответы по вопросу из других игр (исключая текущую игру)
   * @param question - текст вопроса
   * @param excludeGameId - ID игры, которую нужно исключить
   * @param page - номер страницы (начиная с 1)
   * @param limit - количество ответов на странице
   * @returns объект с ответами и общим количеством
   */
  async findByQuestionExcludingGame(
    question: string,
    excludeGameId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ answers: AnswerDocument[]; total: number }> {
    // Находим все игры с таким же вопросом, исключая текущую игру
    const matchingGames = await this.gameModel
      .find({
        question: question,
        _id: { $ne: excludeGameId },
      })
      .select('_id')
      .exec();

    const matchingGameIds = matchingGames.map((game) => game._id);

    if (matchingGameIds.length === 0) {
      return { answers: [], total: 0 };
    }

    // Вычисляем skip для пагинации
    const skip = (page - 1) * limit;

    // Получаем ответы из найденных игр с пагинацией
    const answers = await this.answerModel
      .find({ gameId: { $in: matchingGameIds as any } })
      .populate('user', 'name telegramUsername telegramFirstName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Сортируем по дате создания (новые первыми)
      .exec();

    // Получаем общее количество ответов
    const total = await this.answerModel
      .countDocuments({ gameId: { $in: matchingGameIds as any } })
      .exec();

    return { answers, total };
  }
}

