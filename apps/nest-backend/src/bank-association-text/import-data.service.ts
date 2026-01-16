import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { BankAssociationTextApplicationService } from './application/services/bank-association-text.application.service';
import { AnswerApplicationService } from '../answers/application/services/answer.application.service';

@Injectable()
export class ImportDataService {
  constructor(
    private readonly bankAssociationTextApplicationService: BankAssociationTextApplicationService,
    private readonly answerApplicationService: AnswerApplicationService,
  ) {}

  /**
   * Импортирует данные из файла data.json
   * Удаляет все старые записи перед импортом
   * @returns объект с результатами импорта
   */
  async importFromFile(): Promise<{
    success: boolean;
    imported: number;
    deleted: {
      bankAssociationTexts: number;
      answers: number;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    let deletedBankAssociationTexts = 0;
    let deletedAnswers = 0;

    try {
      // Удаляем все старые записи
      const deleteBankResult =
        await this.bankAssociationTextApplicationService.deleteAll();
      deletedBankAssociationTexts = deleteBankResult.deletedCount;

      const deleteAnswersResult =
        await this.answerApplicationService.deleteAllWithBankAssociationTextId();
      deletedAnswers = deleteAnswersResult.deletedCount;
      // Читаем файл data.json из папки public
      // Пробуем разные пути для dev и production режимов
      let filePath = join(__dirname, '..', '..', '..', 'public', 'data.json');
      if (!existsSync(filePath)) {
        // Если не нашли, пробуем относительно корня проекта
        filePath = join(
          process.cwd(),
          'apps',
          'nest-backend',
          'public',
          'data.json',
        );
      }
      if (!existsSync(filePath)) {
        // Последняя попытка - относительно текущей директории
        filePath = join(process.cwd(), 'public', 'data.json');
      }

      if (!existsSync(filePath)) {
        return {
          success: false,
          imported: 0,
          deleted: {
            bankAssociationTexts: deletedBankAssociationTexts,
            answers: deletedAnswers,
          },
          errors: [
            `Файл data.json не найден. Проверенные пути: ${join(__dirname, '..', '..', '..', 'public', 'data.json')}, ${join(process.cwd(), 'apps', 'nest-backend', 'public', 'data.json')}, ${join(process.cwd(), 'public', 'data.json')}`,
          ],
        };
      }

      const fileContent = readFileSync(filePath, 'utf-8');
      const data: string[] = JSON.parse(fileContent);

      const BATCH_SIZE = 30;

      // Обрабатываем данные батчами по 30 записей
      for (
        let batchStart = 0;
        batchStart < data.length;
        batchStart += BATCH_SIZE
      ) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, data.length);
        const batch = data.slice(batchStart, batchEnd);

        // Обрабатываем каждый элемент в батче
        for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
          const i = batchStart + batchIndex;
          try {
            const line = batch[batchIndex];

            // Разделяем по <br><br>
            const parts = line.split('<br><br>');

            if (parts.length !== 2) {
              errors.push(
                `Строка ${i + 1}: неверный формат (должно быть разделение по <br><br>)`,
              );
              continue;
            }

            const question = parts[0].trim();
            const answersPart = parts[1].trim();

            if (!question) {
              errors.push(`Строка ${i + 1}: вопрос пустой`);
              continue;
            }

            // Создаем запись в bank-association-text
            const bankAssociationText =
              await this.bankAssociationTextApplicationService.create({
                question,
                status: true,
              });

            const bankAssociationTextId = bankAssociationText._id;

            // Парсим ответы
            const answerLines = answersPart.split('<br>');

            for (const answerLine of answerLines) {
              const trimmedLine = answerLine.trim();
              if (!trimmedLine) {
                continue;
              }

              // Парсим формат "число | текст"
              const match = trimmedLine.match(/^(\d+)\s*\|\s*(.+)$/);

              if (!match) {
                errors.push(
                  `Строка ${i + 1}, ответ "${trimmedLine}": неверный формат (должно быть "число | текст")`,
                );
                continue;
              }

              const count = parseInt(match[1], 10);
              const answerText = match[2].trim();

              if (isNaN(count) || count <= 0) {
                errors.push(
                  `Строка ${i + 1}, ответ "${trimmedLine}": неверное число повторений`,
                );
                continue;
              }

              if (!answerText) {
                errors.push(
                  `Строка ${i + 1}, ответ "${trimmedLine}": текст ответа пустой`,
                );
                continue;
              }

              // Создаем N записей в answers
              for (let j = 0; j < count; j++) {
                await this.answerApplicationService.create({
                  text: answerText,
                  bankAssociationTextId,
                });
              }
            }

            imported++;
          } catch (error) {
            errors.push(
              `Строка ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }

      return {
        success: errors.length === 0,
        imported,
        deleted: {
          bankAssociationTexts: deletedBankAssociationTexts,
          answers: deletedAnswers,
        },
        errors,
      };
    } catch (error) {
      return {
        success: false,
        imported,
        deleted: {
          bankAssociationTexts: deletedBankAssociationTexts,
          answers: deletedAnswers,
        },
        errors: [
          `Ошибка чтения файла: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }
}
