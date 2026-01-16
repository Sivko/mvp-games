import { Injectable, Inject } from '@nestjs/common';
import {
  IBankAssociationTextRepository,
  BankAssociationTextData,
} from '../repositories/bank-association-text.repository.interface';

@Injectable()
export class QuestionSelectorService {
  constructor(
    @Inject('IBankAssociationTextRepository')
    private readonly bankAssociationTextRepository: IBankAssociationTextRepository,
  ) {}

  async selectRandomQuestion(
    usedQuestionIds: string[] = [],
  ): Promise<{ _id: string; question: string } | null> {
    const allQuestions = await this.bankAssociationTextRepository.findAll();

    if (allQuestions.length === 0) {
      return null;
    }

    const availableQuestions = allQuestions.filter(
      (q) => !usedQuestionIds.includes(q._id),
    );

    if (availableQuestions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const randomQuestion = availableQuestions[randomIndex];

    return {
      _id: randomQuestion._id,
      question: randomQuestion.question,
    };
  }
}
