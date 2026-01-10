const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface CreateUserData {
  name?: string;
  telegramId?: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramPhotoUrl?: string;
  telegramLanguageCode?: string;
}

export interface UserResponse {
  id: string;
  name: string;
  telegramFirstName?: string;
  telegramUsername?: string;
}

export const usersApi = {
  /**
   * Авторизует пользователя через Telegram initData
   * @param initData - строка initData из Telegram WebApp
   */
  async authByTelegram(initData: string): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/users/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to authenticate' }));
      throw new Error(error.message || 'Failed to authenticate');
    }
    return response.json();
  },

  async findOrCreateUser(userData: CreateUserData): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/users/find-or-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    return response.json();
  },
};


