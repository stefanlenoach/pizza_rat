/**
 * Chat API service for the PizzaRat app
 * This service handles communication with the chat API endpoints
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';

// Base URL for API requests
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// Types
export interface ChatGroup {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
  placeId?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  timestamp: string;
  avatar: string;
  isCurrentUser: boolean;
}


// Current user info (would normally come from auth)
const id = new Date().getTime().toString();
export const CURRENT_USER = {
  id,
  name: `User ${id}`,
  avatar: '',
};
 

// API functions
export const chatApi = {
  /**
   * Get all chat groups
   */
  getChatGroups: async (): Promise<ChatGroup[]> => {
    try {
      // First try to fetch from the API
      try {
        const response = await fetch(`${API_BASE_URL}/chat/groups`);
        
        if (response.ok) {
          const data = await response.json();
          return data.chatGroups;
        }
      } catch (error) {
        console.log('Error fetching chat groups from API, using mock data:', error);
      }
      
      // If API fails, use mock data from the app
      return getMockChatGroups();
    } catch (error) {
      console.error('Error in getChatGroups:', error);
      return [];
    }
  },
  
  /**
   * Get messages for a specific chat group
   */
  getChatMessages: async (groupId: string): Promise<ChatMessage[]> => {
    try {
      // First try to fetch from the API
      try {
        const response = await fetch(`${API_BASE_URL}/chat/messages/${groupId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Transform messages to include isCurrentUser flag for UI
          return data.messages.map((message: ChatMessage) => ({
            ...message,
            isCurrentUser: message.senderId === CURRENT_USER.id,
          }));
        }
      } catch (error) {
        console.log('Error fetching chat messages from API, using mock data:', error);
      }
      
      // If API fails, use mock data from the app
      return getMockChatMessages(groupId);
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      return [];
    }
  },
  
  /**
   * Send a new message to a chat group
   */
  sendMessage: async (groupId: string, text: string): Promise<ChatMessage | null> => {
    try {
      // First try to send to the API
      try {
        const response = await fetch(`${API_BASE_URL}/chat/messages/${groupId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            sender: CURRENT_USER.name,
            senderId: CURRENT_USER.id,
            avatar: CURRENT_USER.avatar,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            ...data.message,
            isCurrentUser: true,
          };
        }
      } catch (error) {
        console.log('Error sending message to API, using mock data:', error);
      }
      
      // If API fails, create a mock message
      const newMessage = {
        id: Date.now().toString(),
        text,
        sender: CURRENT_USER.name,
        senderId: CURRENT_USER.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: CURRENT_USER.avatar,
        isCurrentUser: true,
      };
      
      return newMessage;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return null;
    }
  },
};

// Mock data functions for fallback
function getMockChatGroups(): ChatGroup[] {
  return [
    {
      id: '1',
      name: "Pizza Lovers NYC",
      lastMessage: "The margherita is amazing!",
      timestamp: "10:30 AM",
      unread: 3,
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      placeId: "1"
    },
    {
      id: '2',
      name: "Chicago Deep Dish",
      lastMessage: "Who's up for lunch?",
      timestamp: "Yesterday",
      unread: 0,
      avatar: "https://randomuser.me/api/portraits/women/2.jpg",
      placeId: "2"
    },
    {
      id: '3',
      name: "Brooklyn Pizza Scene",
      lastMessage: "New spot opening next week!",
      timestamp: "2 days ago",
      unread: 1,
      avatar: "https://randomuser.me/api/portraits/men/3.jpg",
      placeId: "3"
    }
  ];
}

function getMockChatMessages(groupId: string): ChatMessage[] {
  const mockMessages: Record<string, ChatMessage[]> = {
    '1': [
      {
        id: '1',
        text: 'Hey pizza lovers! Anyone tried the new place on 5th Ave?',
        sender: 'John',
        senderId: 'user123',
        timestamp: '10:15 AM',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
      {
        id: '2',
        text: 'Yes! Their margherita is amazing ',
        sender: 'You',
        senderId: 'user456',
        timestamp: '10:18 AM',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: true
      },
      {
        id: '3',
        text: 'I heard they use a special flour imported from Naples',
        sender: 'Sarah',
        senderId: 'user789',
        timestamp: '10:20 AM',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
      {
        id: '4',
        text: 'The crust is perfectly charred but still chewy inside',
        sender: 'Mike',
        senderId: 'user321',
        timestamp: '10:22 AM',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
      {
        id: '5',
        text: 'We should organize a pizza crawl this weekend!',
        sender: 'You',
        senderId: 'user456',
        timestamp: '10:25 AM',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: true
      },
      {
        id: '6',
        text: 'Great idea! I can suggest a route through Brooklyn',
        sender: 'Sarah',
        senderId: 'user789',
        timestamp: '10:28 AM',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
      {
        id: '7',
        text: 'Count me in! I know a hidden gem in Williamsburg',
        sender: 'John',
        senderId: 'user123',
        timestamp: '10:30 AM',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
    ],
    '2': [
      {
        id: '1',
        text: 'Who\'s coming to Roberta\'s this Friday?',
        sender: 'Alex',
        senderId: 'user555',
        timestamp: '9:15 AM',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
      {
        id: '2',
        text: 'I\'ll be there! What time?',
        sender: 'You',
        senderId: 'user456',
        timestamp: '9:20 AM',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: true
      },
      {
        id: '3',
        text: 'Let\'s meet at 7pm',
        sender: 'Alex',
        senderId: 'user555',
        timestamp: '9:22 AM',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
      {
        id: '4',
        text: 'Sounds good!',
        sender: 'You',
        senderId: 'user456',
        timestamp: 'Yesterday',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: true
      },
    ],
    '3': [
      {
        id: '1',
        text: 'Has anyone tried the Detroit style at Emmy Squared?',
        sender: 'David',
        senderId: 'user777',
        timestamp: 'Monday',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
    ],
    '4': [
      {
        id: '1',
        text: 'My sourdough starter is finally ready!',
        sender: 'Chef Mario',
        senderId: 'user888',
        timestamp: '3/20/25',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&auto=format&fit=crop',
        isCurrentUser: false
      },
    ],
  };
  
  return mockMessages[groupId] || [];
}

export default chatApi;
