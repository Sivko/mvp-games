const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ReactionType {
  _id?: string;
  name: string;
  image: string | null;
  weight: number;
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete reaction type');
    }
  },
};



