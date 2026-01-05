const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Answer {
  _id: string
  gameId: string
  user: string
  text: string
  similarity: number
  score: number
}

export const answersApi = {
  async createAnswer(data: {
    gameId: string
    userId: string
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
}

