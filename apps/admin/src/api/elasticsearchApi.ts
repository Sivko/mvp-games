const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface WordCount {
  text: string;
  count: number;
}

export const elasticsearchApi = {
  async getUniqueWords(
    size?: number,
    bankAssociationTextId?: string,
  ): Promise<WordCount[]> {
    const params = new URLSearchParams();
    if (size !== undefined) {
      params.append('size', size.toString());
    }
    if (bankAssociationTextId) {
      params.append('bankAssociationTextId', bankAssociationTextId);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/elasticsearch/unique-words${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch unique words' }));
      throw new Error(error.message || 'Failed to fetch unique words');
    }
    return response.json();
  },

  async initialize(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/elasticsearch/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to initialize Elasticsearch' }));
      throw new Error(error.message || 'Failed to initialize Elasticsearch');
    }
    return response.json();
  },

  async calculateScore(data: {
    bankAssociationTextId: string;
    text: string;
    answerId?: string;
  }): Promise<{ score: number }> {
    const response = await fetch(`${API_BASE_URL}/elasticsearch/calculate-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to calculate score' }));
      throw new Error(error.message || 'Failed to calculate score');
    }
    return response.json();
  },
};

