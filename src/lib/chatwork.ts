// Chatwork API Types
export interface ChatworkMember {
  account_id: number;
  name: string;
  chatwork_id: string;
  organization_id: number;
  organization_name: string;
  department: string;
  avatar_image_url: string;
}

export interface ChatworkRoom {
  room_id: number;
  name: string;
  type: string;
  icon_path: string;
}

// Chatwork API Client
class ChatworkAPI {
  private baseUrl = 'https://api.chatwork.com/v2';

  private async fetch<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-ChatWorkToken': token,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chatwork API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get current user's info to validate token
  async getMe(token: string): Promise<{ account_id: number; name: string }> {
    return this.fetch('/me', token);
  }

  // Get list of rooms
  async getRooms(token: string): Promise<ChatworkRoom[]> {
    return this.fetch('/rooms', token);
  }

  // Get room members
  async getRoomMembers(token: string, roomId: number): Promise<ChatworkMember[]> {
    return this.fetch(`/rooms/${roomId}/members`, token);
  }

  // Get contacts
  async getContacts(token: string): Promise<ChatworkMember[]> {
    return this.fetch('/contacts', token);
  }
}

export const chatworkAPI = new ChatworkAPI();

// Helper to validate token
export async function validateChatworkToken(token: string): Promise<boolean> {
  try {
    await chatworkAPI.getMe(token);
    return true;
  } catch {
    return false;
  }
}

// Get all unique members from contacts
export async function getChatworkMembers(
  token: string
): Promise<ChatworkMember[]> {
  try {
    const contacts = await chatworkAPI.getContacts(token);
    return contacts;
  } catch (error) {
    console.error('Error fetching Chatwork members:', error);
    throw error;
  }
}

// Get members from a specific room
export async function getChatworkRoomMembers(
  token: string,
  roomId: number
): Promise<ChatworkMember[]> {
  try {
    return await chatworkAPI.getRoomMembers(token, roomId);
  } catch (error) {
    console.error('Error fetching room members:', error);
    throw error;
  }
}
