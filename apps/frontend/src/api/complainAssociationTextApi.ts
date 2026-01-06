const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface ComplainAssociationText {
  _id?: string
  bankAssociationTextId?: string
  answerId?: string
  userId: string
  createdAt?: Date
}

export const complainAssociationTextApi = {
  async createComplain(data: {
    bankAssociationTextId?: string
    answerId?: string
    userId: string
  }): Promise<ComplainAssociationText> {
    const response = await fetch(`${API_BASE_URL}/complain-association-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create complain')
    }
    return response.json()
  },
}



