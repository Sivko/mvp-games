const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Reaction {
  _id: string
  answerId: string
  userId: string
  reactionId: string
  createdAt: string
}

export const reactionsApi = {
  async createReaction(data: {
    answerId: string
    userId: string
    reactionId: string
  }): Promise<Reaction> {
    const response = await fetch(`${API_BASE_URL}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create reaction')
    }
    return response.json()
  },

  async getReactionsByAnswerId(answerId: string): Promise<Reaction[]> {
    const response = await fetch(`${API_BASE_URL}/reactions/answer/${answerId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch reactions')
    }
    return response.json()
  },

  async getReactionsByGameId(gameId: string): Promise<Reaction[]> {
    const response = await fetch(`${API_BASE_URL}/reactions/game/${gameId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch reactions by game')
    }
    return response.json()
  },

  async deleteReaction(
    answerId: string,
    userId: string,
    reactionId: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/reactions/answer/${answerId}/user/${userId}/reaction/${reactionId}`,
      {
        method: 'DELETE',
      },
    )
    if (!response.ok) {
      throw new Error('Failed to delete reaction')
    }
  },
}

