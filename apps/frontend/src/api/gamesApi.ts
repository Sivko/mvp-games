const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Game {
  _id: string;
  typeGame: string;
  createdBy: string;
  status: string;
  gamesCount: number;
  question: string;
  usedQuestions: number[];
}

export interface GameStats {
  typeGame: string;
  activeGamesCount: number;
  onlineUsersCount: number;
}

export const gamesApi = {
  async createGame(gameData: {
    typeGame: string;
    createdBy: string;
  }): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData),
    });
    if (!response.ok) {
      throw new Error('Failed to create game');
    }
    return response.json();
  },

  async getGameById(id: string): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game');
    }
    return response.json();
  },

  async getGamesByType(typeGame: string): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/games/type/${typeGame}`);
    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }
    return response.json();
  },

  async getGameStats(userId: string): Promise<GameStats[]> {
    const response = await fetch(`${API_BASE_URL}/games/stats/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game stats');
    }
    return response.json();
  },

  async getActiveGameByUserAndType(
    userId: string,
    typeGame: string,
  ): Promise<Game | null> {
    const response = await fetch(
      `${API_BASE_URL}/games/user/${userId}/type/${typeGame}/active`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch active game');
    }
    const data = await response.json();
    return data || null;
  },
};

