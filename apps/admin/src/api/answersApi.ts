const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Answer {
  _id: string;
  gameId: string;
  user?: string | {
    _id: string;
    name: string;
    telegramUsername?: string;
    telegramFirstName?: string;
  };
  text: string;
  similarity?: number;
  score?: number;
  bankAssociationTextId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnswersByQuestionResponse {
  answers: Answer[];
  total: number;
}

export const answersApi = {
  async getByQuestion(
    question: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<AnswersByQuestionResponse> {
    const params = new URLSearchParams({
      question,
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`${API_BASE_URL}/answers/by-question/all?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch answers by question');
    }
    return response.json();
  },

  async getById(id: string): Promise<Answer> {
    const response = await fetch(`${API_BASE_URL}/answers/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch answer');
    }
    return response.json();
  },

  async update(id: string, data: { text?: string; score?: number }): Promise<Answer> {
    const response = await fetch(`${API_BASE_URL}/answers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update answer');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/answers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete answer');
    }
  },
};

