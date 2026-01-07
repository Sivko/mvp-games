const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface ReactionType {
  _id: string
  name: string
  image: string | null
  textFromFinalRound: string | null
}

export const reactionTypesApi = {
  async getAll(): Promise<ReactionType[]> {
    const response = await fetch(`${API_BASE_URL}/reaction-types`)
    if (!response.ok) {
      throw new Error('Failed to fetch reaction types')
    }
    return response.json()
  },
}

