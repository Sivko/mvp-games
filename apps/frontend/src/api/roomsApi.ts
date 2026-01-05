const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Room {
  _id: string;
  roomNumber?: number;
  sourceWord?: string;
  status?: string;
  [key: string]: any;
}

export const roomsApi = {
  async getAllRooms(): Promise<Room[]> {
    const response = await fetch(`${API_BASE_URL}/room`);
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    return response.json();
  },

  async getRoomById(id: string): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/room/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch room');
    }
    return response.json();
  },

  async createRoom(roomData: Partial<Room>): Promise<Room> {
    const response = await fetch(`${API_BASE_URL}/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomData),
    });
    if (!response.ok) {
      throw new Error('Failed to create room');
    }
    return response.json();
  },
};

