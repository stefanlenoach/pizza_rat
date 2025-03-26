export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  timestamp: string;
  avatar?: string;
  isCurrentUser: boolean;
  placeId: string;
  created_at: string;
}

export interface ChatGroup {
  id: string;
  placeId: string;
  name: string;
  timestamp?: string;
  lastMessage?: string;
  created_at?: string;
  avatar?: string;
  unread?: number;
}
