import { Test, TestingModule } from '@nestjs/testing';
import { QuestionSelectorService } from './question-selector.service';
import {
  IBankAssociationTextRepository,
  BankAssociationTextData,
} from '../repositories/bank-association-text.repository.interface';

describe('QuestionSelectorService', () => {
  let service: QuestionSelectorService;
  let repository: jest.Mocked<IBankAssociationTextRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<IBankAssociationTextRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionSelectorService,
        {
          provide: 'IBankAssociationTextRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<QuestionSelectorService>(QuestionSelectorService);
    repository = module.get('IBankAssociationTextRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('selectRandomQuestion', () => {
    it('should return null when no questions available', async () => {
      repository.findAll.mockResolvedValue([]);
      const result = await service.selectRandomQuestion();
      expect(result).toBeNull();
    });

    it('should return a random question', async () => {
      const questions: BankAssociationTextData[] = [
        { _id: '1', question: 'Question 1', status: true },
        { _id: '2', question: 'Question 2', status: true },
        { _id: '3', question: 'Question 3', status: true },
      ];
      repository.findAll.mockResolvedValue(questions);
      const result = await service.selectRandomQuestion();
      expect(result).not.toBeNull();
      expect(result?._id).toBeDefined();
      expect(result?.question).toBeDefined();
      expect(questions.some((q) => q._id === result?._id)).toBe(true);
    });

    it('should exclude used questions', async () => {
      const questions: BankAssociationTextData[] = [
        { _id: '1', question: 'Question 1', status: true },
        { _id: '2', question: 'Question 2', status: true },
        { _id: '3', question: 'Question 3', status: true },
      ];
      repository.findAll.mockResolvedValue(questions);
      const result = await service.selectRandomQuestion(['1', '2']);
      expect(result).not.toBeNull();
      expect(result?._id).toBe('3');
    });

    it('should return null when all questions are used', async () => {
      const questions: BankAssociationTextData[] = [
        { _id: '1', question: 'Question 1', status: true },
        { _id: '2', question: 'Question 2', status: true },
      ];
      repository.findAll.mockResolvedValue(questions);
      const result = await service.selectRandomQuestion(['1', '2']);
      expect(result).toBeNull();
    });
  });
});
