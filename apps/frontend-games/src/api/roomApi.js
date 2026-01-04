const API_BASE_URL = 'http://localhost:3000';

export const roomApi = {
  async getAllRooms() {
    const response = await fetch(`${API_BASE_URL}/room`);
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    return response.json();
  },

  async getRoomById(id) {
    const response = await fetch(`${API_BASE_URL}/room/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch room');
    }
    return response.json();
  },

  async createRoom(roomData) {
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

