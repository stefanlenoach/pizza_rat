// Chat API endpoints for the PizzaRat app
const express = require('express');
const router = express.Router();

// Mock data for chat groups
const CHAT_GROUPS = [
  {
    id: '1',
    name: 'NYC Pizza Lovers',
    lastMessage: 'Just tried the new place on 5th Ave!',
    timestamp: '10:30 AM',
    unread: 3,
    avatar: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Brooklyn Pizza Club',
    lastMessage: 'Meeting this Friday at Roberta\'s?',
    timestamp: 'Yesterday',
    unread: 0,
    avatar: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=100&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'Pizza Recommendations',
    lastMessage: 'Has anyone tried the Detroit style at Emmy Squared?',
    timestamp: 'Monday',
    unread: 1,
    avatar: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=100&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'Pizza Chefs',
    lastMessage: 'My sourdough starter is finally ready!',
    timestamp: '3/20/25',
    unread: 0,
    avatar: 'https://images.unsplash.com/photo-1595854341625-f33e09b6a29c?q=80&w=100&auto=format&fit=crop'
  },
];

// Mock data for chat messages by group ID
const CHAT_MESSAGES = {
  '1': [
    {
      id: '1',
      text: 'Hey pizza lovers! Anyone tried the new place on 5th Ave?',
      sender: 'John',
      senderId: 'user123',
      timestamp: '10:15 AM',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: '2',
      text: 'Yes! Their margherita is amazing 🍕',
      sender: 'Sarah',
      senderId: 'user456',
      timestamp: '10:18 AM',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: '3',
      text: 'I heard they use a special flour imported from Naples',
      sender: 'Mike',
      senderId: 'user789',
      timestamp: '10:20 AM',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: '4',
      text: 'The crust is perfectly charred but still chewy inside',
      sender: 'Lisa',
      senderId: 'user321',
      timestamp: '10:22 AM',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: '5',
      text: 'We should organize a pizza crawl this weekend!',
      sender: 'John',
      senderId: 'user123',
      timestamp: '10:25 AM',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: '6',
      text: 'Great idea! I can suggest a route through Brooklyn',
      sender: 'Sarah',
      senderId: 'user456',
      timestamp: '10:28 AM',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: '7',
      text: 'Count me in! I know a hidden gem in Williamsburg',
      sender: 'John',
      senderId: 'user123',
      timestamp: '10:30 AM',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
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
    },
    {
      id: '2',
      text: 'I\'ll be there! What time?',
      sender: 'Jessica',
      senderId: 'user666',
      timestamp: '9:20 AM',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: '3',
      text: 'Let\'s meet at 7pm',
      sender: 'Alex',
      senderId: 'user555',
      timestamp: '9:22 AM',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: '4',
      text: 'Sounds good!',
      sender: 'Jessica',
      senderId: 'user666',
      timestamp: 'Yesterday',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop',
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
    },
  ],
};

// Get all chat groups
router.get('/groups', (req, res) => {
  res.json({ chatGroups: CHAT_GROUPS });
});

// Get a specific chat group
router.get('/groups/:id', (req, res) => {
  const { id } = req.params;
  const chatGroup = CHAT_GROUPS.find(group => group.id === id);
  
  if (!chatGroup) {
    return res.status(404).json({ error: 'Chat group not found' });
  }
  
  res.json({ chatGroup });
});

// Get messages for a specific chat group
router.get('/messages/:groupId', (req, res) => {
  const { groupId } = req.params;
  const messages = CHAT_MESSAGES[groupId] || [];
  
  res.json({ messages });
});

// Post a new message to a chat group
router.post('/messages/:groupId', (req, res) => {
  const { groupId } = req.params;
  const { text, sender, senderId, avatar } = req.body;
  
  if (!text || !sender || !senderId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!CHAT_MESSAGES[groupId]) {
    CHAT_MESSAGES[groupId] = [];
  }
  
  const newMessage = {
    id: Date.now().toString(),
    text,
    sender,
    senderId,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avatar: avatar || 'https://via.placeholder.com/100',
  };
  
  CHAT_MESSAGES[groupId].push(newMessage);
  
  // Update the last message in the chat group
  const groupIndex = CHAT_GROUPS.findIndex(group => group.id === groupId);
  if (groupIndex !== -1) {
    CHAT_GROUPS[groupIndex].lastMessage = text;
    CHAT_GROUPS[groupIndex].timestamp = newMessage.timestamp;
  }
  
  res.status(201).json({ message: newMessage });
});

module.exports = router;
