const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface WordCount {
  text: string
  count: number
}

export const elasticsearchApi = {
  async getUniqueWords(
    size?: number,
    bankAssociationTextId?: string,
  ): Promise<WordCount[]> {
    const params = new URLSearchParams()
    if (size !== undefined) {
      params.append('size', size.toString())
    }
    if (bankAssociationTextId) {
      params.append('bankAssociationTextId', bankAssociationTextId)
    }
    
    const queryString = params.toString()
    const url = `${API_BASE_URL}/elasticsearch/unique-words${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch unique words')
    }
    return response.json()
  },
}

