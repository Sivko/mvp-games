const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface Game {
  _id: string
  typeGame: string
  createdBy: string
  status: string
  gamesCount: number
  question: string
  usedQuestions: string[]
}

export interface GameStats {
  typeGame: string
  activeGamesCount: number
  onlineUsersCount: number
}

export const gamesApi = {
  async findOrCreateGameByUserAndType(userId: string, typeGame: string): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/user/${userId}/type/${typeGame}`)
    if (!response.ok) {
      throw new Error('Failed to fetch game')
    }
    return response.json()
  },

  async getActiveGameByUser(userId: string): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/games/user/${userId}/active`)
    if (!response.ok) {
      throw new Error('Failed to fetch games')
    }
    const data = await response.json()
    return data || []
  },

  async getActiveGamesByParticipant(userId: string): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/games/user/${userId}/participant`)
    if (!response.ok) {
      throw new Error('Failed to fetch games')
    }
    const data = await response.json()
    return data || []
  },

  async getGameByInvite(inviteUserId: string, typeGame: string): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/invite/${inviteUserId}/${typeGame}`)
    if (!response.ok) {
      throw new Error('Game not found')
    }
    return response.json()
  },

  async getGameById(gameId: string): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`)
    if (!response.ok) {
      throw new Error('Game not found')
    }
    return response.json()
  },
}
