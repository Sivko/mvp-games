const USER_STORAGE_KEY = 'word-game-user';

export interface StoredUser {
  id: string;
  name: string;
}

export const storage = {
  getUser(): StoredUser | null {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  setUser(user: StoredUser): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  clearUser(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};

