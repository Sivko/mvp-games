const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (ADMIN_SECRET) {
    headers['X-Admin-Secret'] = ADMIN_SECRET;
  }
  return headers;
};

export interface ReactionType {
  _id?: string;
  name: string;
  image: string | null;
  textFromFinalRound: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const reactionTypesApi = {
  async getAll(): Promise<ReactionType[]> {
    const response = await fetch(`${API_BASE_URL}/reaction-types`);
    if (!response.ok) {
      throw new Error('Failed to fetch reaction types');
    }
    return response.json();
  },

  async getById(id: string): Promise<ReactionType> {
    const response = await fetch(`${API_BASE_URL}/reaction-types/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch reaction type');
    }
    return response.json();
  },

  async create(data: Partial<ReactionType>): Promise<ReactionType> {
    const response = await fetch(`${API_BASE_URL}/reaction-types`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create reaction type');
    }
    return response.json();
  },

  async update(id: string, data: Partial<ReactionType>): Promise<ReactionType> {
    const response = await fetch(`${API_BASE_URL}/reaction-types/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update reaction type');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reaction-types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete reaction type');
    }
  },
};



