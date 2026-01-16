export type GamePhase = 'input' | 'results' | 'finish';

export interface GameRoomUser {
  userId: string;
  socketId: string;
}

export interface GameRoom {
  gameId: string;
  users: Map<string, GameRoomUser>; // Map<socketId, { userId, socketId }>
  uniqueUserIds: Set<string>; // Set уникальных userId для правильного подсчета пользователей
  phase: GamePhase;
  timer: ReturnType<typeof setTimeout> | null;
  timerEndsAt: number | null;
  readyUsers: Set<string>; // Set of userIds who are ready
  userScores: Map<string, number>; // Map<userId, totalScore> - общие очки пользователей
}

export interface AnswerWithUserName {
  id: string;
  userId: string;
  text: string;
  userName: string;
  score: number;
}

export interface PlayerInfo {
  userId: string;
  userName: string;
  initial: string;
  telegramPhotoUrl?: string;
}

export interface GameRoomState {
  phase: GamePhase;
  onlineUsersCount: number;
  timerEndsAt: number | null;
  readyCount: number;
  readyUsers: string[];
  userScores: Record<string, number>;
  currentRound: number;
  maxRounds: number;
  question?: string;
  answers?: AnswerWithUserName[];
  players?: PlayerInfo[];
  isGameFinished?: boolean;
}
