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


