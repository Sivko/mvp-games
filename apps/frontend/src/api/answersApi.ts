const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Answer {
  _id: string
  gameId: string
  user?: string | {
    _id: string
    name: string
    telegramUsername?: string
    telegramFirstName?: string
  }
  text: string
  similarity: number
  score: number
}

export interface AnswersByQuestionResponse {
  answers: Answer[]
  total: number
}

export const answersApi = {
  async createAnswer(data: {
    gameId: string
    userId?: string
    text: string
  }): Promise<Answer> {
    const response = await fetch(`${API_BASE_URL}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create answer')
    }
    return response.json()
  },

  async getAnswersByGameId(gameId: string): Promise<Answer[]> {
    const response = await fetch(`${API_BASE_URL}/answers/game/${gameId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch answers')
    }
    return response.json()
  },

  async getAnswersByQuestion(
    question: string,
    excludeGameId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<AnswersByQuestionResponse> {
    const params = new URLSearchParams({
      question,
      excludeGameId,
      page: page.toString(),
      limit: limit.toString(),
    })
    const response = await fetch(`${API_BASE_URL}/answers/by-question?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch answers by question')
    }
    return response.json()
  },

  async getAnswersByBankAssociationTextId(
    bankAssociationTextId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<AnswersByQuestionResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    const response = await fetch(`${API_BASE_URL}/answers/by-bank-association-text-id/${bankAssociationTextId}?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch answers by bank association text id')
    }
    return response.json()
  },
}

