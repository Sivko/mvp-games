const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface BankAssociationText {
  _id?: string;
  question: string;
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const bankAssociationTextApi = {
  async getAll(): Promise<BankAssociationText[]> {
    const response = await fetch(`${API_BASE_URL}/bank-association-text`);
    if (!response.ok) {
      throw new Error('Failed to fetch bank association texts');
    }
    return response.json();
  },

  async getById(id: string): Promise<BankAssociationText> {
    const response = await fetch(`${API_BASE_URL}/bank-association-text/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch bank association text');
    }
    return response.json();
  },

  async create(data: Partial<BankAssociationText>): Promise<BankAssociationText> {
    const response = await fetch(`${API_BASE_URL}/bank-association-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create bank association text');
    }
    return response.json();
  },

  async update(id: string, data: Partial<BankAssociationText>): Promise<BankAssociationText> {
    const response = await fetch(`${API_BASE_URL}/bank-association-text/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update bank association text');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/bank-association-text/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete bank association text');
    }
  },
};


