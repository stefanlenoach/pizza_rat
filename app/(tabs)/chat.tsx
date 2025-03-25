import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Easing, Dimensions } from 'react-native';
import { 
  View, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Animated,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { Text, Heading, Subheading, Paragraph, Caption, Label } from '@/components/CustomText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import tw from '@/utils/tw';
import { IconSymbol } from '@/components/ui/IconSymbol';
import chatApi, { ChatGroup, ChatMessage } from '@/services/chatApi';
import { supabase } from '@/lib/supabase';
import { mockPizzaPlaces } from '@/utils/mockPizzaData'; 
import moment from 'moment'

const id = new Date().getTime().toString();
const CURRENT_USER = {
  id,
  name: `User ${id}`,
  avatar: '',
};

// Initial empty states
const INITIAL_CHAT_GROUPS: ChatGroup[] = [
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

// Initial empty messages
const INITIAL_MESSAGES: ChatMessage[] = [
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
    text: 'Yes! Their margherita is amazing 🍕',
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
];

export default function ChatScreen() {
  const router = useRouter();
  const { placeId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [activeChat, setActiveChat] = useState<ChatGroup | null>(null);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const flatListRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const windowWidth = Dimensions.get('window').width;

  
  // Focus the input when a chat is opened
  useEffect(() => {
    if (activeChat) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300); // Wait for animation to complete
    }
  }, [activeChat]);
  
  // Load chat groups when component mounts
  useEffect(() => {
    const loadChatGroups = async () => {
      try {
        setIsLoading(true);
        // If placeId is provided, load specific chat group
        if (placeId) {
          setMessages([]);
          const { data: groups } = await supabase.from('Chats').select('*')  
          const placeGroup = groups?.find(group => group.placeId === placeId);
          if (placeGroup) {
            setChatGroups([placeGroup]);
            openChat(placeGroup);
            setActiveChat(placeGroup);
            Animated.timing(slideAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease)
            }).start();
          } else {
            const placeGroup = mockPizzaPlaces.find(place => place.id === placeId); 
            setChatGroups(groups || []);
            setActiveChat({ placeId, name: placeGroup?.name || '' });
            openChat({ placeId, name: placeGroup?.name || ''  });
          } 
          
         
          
        } else {
          const { data: groups } = await supabase.from('Chats').select('*') 
          setChatGroups(groups || []);
        }
      } catch (error) {
        console.error('Error loading chat groups:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadChatGroups();
  }, [placeId]);
 
  
  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    if (activeChat) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200, // Faster animation
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic), // Smoother easing
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200, // Faster animation
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic), // Smoother easing
      }).start();
    }
  }, [activeChat, slideAnim]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || !activeChat || isSending) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);
    
    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for better UX
    
    try {
      // Optimistically add message to UI
      const id = Date.now().toString()
      const optimisticMessage: ChatMessage = {
        id,
        text: messageText,
        sender: CURRENT_USER.name,
        senderId: CURRENT_USER.id, // Current user ID
        timestamp: 'Sending...',
        avatar: CURRENT_USER.avatar,
        isCurrentUser: true
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      
      // Scroll to the bottom immediately
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
      
      // Send message to the API
      const timestamp = new Date().toISOString();
      const { error } = await supabase.from('ChatMessages').insert({
        id, 
        text: messageText,
        senderId: CURRENT_USER.id,
        sender: CURRENT_USER.name,
        timestamp,
        avatar: CURRENT_USER.avatar, 
        placeId: activeChat.placeId
      });


      await supabase.from('Chats').upsert({
        placeId: activeChat.placeId,
        lastMessage: messageText, 
      },{
        onConflict: 'placeId'
      });
 
      if (!error) {
        // Update message with actual timestamp
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if(msg.id === optimisticMessage.id) {
              return {
                ...msg,
                timestamp: moment(timestamp).format('YYYY-MM-DD HH:mm:ss'),
                isCurrentUser: true
              }
            }
            return msg 
          })
        });
        
        // Update the chat group's last message
        const updatedGroups = chatGroups.map(group => {
          if (group.id === activeChat.id) {
            return {
              ...group,
              lastMessage: messageText,
              timestamp: 'Just now'
            };
          }
          return group;
        });
        
        setChatGroups(updatedGroups);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error state or retry option
      // Remove the optimistic message if it failed
    } finally {
      setIsSending(false);
    }
  };

  const openChat = async (chatGroup: ChatGroup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Start transition animation immediately
    setActiveChat(chatGroup);
    
    // Mark as read
    const updatedGroups = chatGroups.map(group => {
      if (group.id === chatGroup.id) {
        return { ...group, unread: 0 };
      }
      return group;
    });
    setChatGroups(updatedGroups);
    
    // Load messages for this chat in parallel with animation
    try {
      const { data: chatMessages } = await supabase
        .from('ChatMessages')
        .select('*')
        .eq('placeId', chatGroup.placeId)
        .order('created_at', { ascending: true });
 
      setMessages((chatMessages || []).map(item => {
        return  {
          ...item,
          timestamp: moment(item.created_at).format('YYYY-MM-DD HH:mm:ss'),
          isCurrentUser: item.senderId === CURRENT_USER.id
        }
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveChat(null);
    setMessages([]);
    // Clear placeId from URL params
    router.replace('/(tabs)/chat');
  };

  const renderChatGroup = ({ item }: { item: ChatGroup }) => (
    <TouchableOpacity 
      style={tw`flex-row items-center p-4 border-b border-gray-200`}
      onPress={() => openChat(item)}
    >
      {item.avatar ? (
        <Image 
          source={{ uri: item.avatar }} 
          style={tw`w-12 h-12 rounded-full mr-3`}
        />
      ) : (
        <View style={tw`mr-3`}>
          <AvatarCircle 
            name={mockPizzaPlaces.find(p => p.id === item.placeId)?.name || item.name} 
            size={48} 
          />
        </View>
      )}
      <View style={tw`flex-1`}>
        <View style={tw`flex-row justify-between`}>
          <Subheading style={tw`text-sm`}>{ mockPizzaPlaces.find(p => p.id === item.placeId)?.name || item.name}</Subheading>
          <Caption>{moment(item.created_at).format('YYYY-MM-DD HH:mm:ss')}</Caption>
        </View>
        <Paragraph 
          style={tw`text-gray-600 mt-1`} 
          numberOfLines={1}
        >
          {item.lastMessage}
        </Paragraph>
      </View>
      {item.unread > 0 && (
        <View style={tw`bg-red-500 rounded-full w-6 h-6 items-center justify-center ml-2`}>
          <Label style={tw`text-white font-bold`}>{item.unread}</Label>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View 
      style={[
        tw`mb-4 max-w-[80%]`, 
        item.isCurrentUser ? tw`self-end` : tw`self-start`
      ]}
    >
      <View style={[
        tw`flex-row items-end`,
        item.isCurrentUser ? tw`flex-row-reverse` : ''
      ]}>
        {!item.isCurrentUser && (
          <>
           {item.avatar ? (
            <Image 
              source={{ uri: item.avatar }} 
              style={tw`w-8 h-8 rounded-full mr-2`}
            />
          ) : (
            <View style={tw`mr-3`}>
              <AvatarCircle 
                name={item.sender} 
                size={48} 
              />
            </View>
          )}
          </>
         
        )}
        <View 
          style={[
            tw`rounded-2xl p-2.5`, 
            item.isCurrentUser 
              ? tw`bg-blue-500 rounded-br-none ml-auto` 
              : tw`bg-gray-200 rounded-bl-none mr-auto`
          ]}
        >
          {!item.isCurrentUser && (
            <Label style={tw`mb-1 text-gray-700`}>
              {item.sender}
            </Label>
          )}
          <Text 
            style={[
              tw`text-sm`, 
              item.isCurrentUser ? tw`text-white` : tw`text-black`
            ]}
          >
            {item.text}
          </Text>
        </View>
        {item.isCurrentUser && (
          <Image 
            source={{ uri: item.avatar }} 
            style={tw`w-8 h-8 rounded-full ml-2`}
          />
        )}
      </View>
      <Text 
        style={[
          tw`text-xs text-gray-500 mt-1`, 
          item.isCurrentUser ? tw`text-right` : tw`text-left ml-10`
        ]}
      >
        { item.timestamp }
      </Text>
    </View>
  );

  const AvatarCircle = ({ name, size = 40 }: { name: string; size?: number }) => {
    const initial = name?.charAt?.(0)?.toUpperCase?.();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500'];
    const colorIndex = (name?.length ?? 0) % colors.length;
  
    return (
      <View 
        style={[
          tw`${colors[colorIndex]} rounded-full items-center justify-center`,
          { width: size, height: size }
        ]}
      >
        <Text style={[tw`text-white font-bold`, { fontSize: size * 0.4 }]}>
          {initial}
        </Text>
      </View>
    );
  };

  const chatListTransform = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -windowWidth]
        })
      }
    ]
  };

  const chatDetailTransform = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [windowWidth, 0]
        })
      }
    ],
    opacity: slideAnim
  };

  console.log('chatGroups',chatGroups)
  console.log('activeChat',activeChat)
  // console.log('messages',messages)
  console.log('placeId',placeId)

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <StatusBar style="dark" />
      
      {/* Chat List View */}
      <Animated.View 
        style={[
          tw`absolute top-0 bottom-0 left-0 right-0 bg-white z-10`,
          chatListTransform
        ]}
      >
        {/* Chat List Header with Safe Area */}
        <View style={[tw`bg-white border-b border-gray-200`, { paddingTop: insets.top }]}>
          <View style={tw`p-4`}>
            <Heading>Chats</Heading>
          </View>
        </View>
        {isLoading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Caption style={tw`mt-2`}>Loading chats...</Caption>
          </View>
        ) : (
          <FlatList
            data={chatGroups}
            renderItem={renderChatGroup}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={tw`p-8 items-center justify-center`}>
                <Text style={tw`text-gray-500 text-center`}>No chat groups found</Text>
              </View>
            }
          />
        )}
      </Animated.View>
      
      {/* Chat Detail View */}
      <Animated.View 
        style={[
          tw`absolute top-0 bottom-0 left-0 right-0 bg-white`,
          { width: windowWidth },
          chatDetailTransform
        ]}
      >
        {activeChat && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[tw`flex-1`, { width: windowWidth }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {/* Chat Header with Safe Area */}
            <View style={[tw`flex-row items-center border-b border-gray-200 bg-white`, { paddingTop: insets.top }]}>
              <View style={tw`flex-row items-center p-4 w-full`}>
                <TouchableOpacity onPress={goBack} style={tw`mr-2`}>
                  <IconSymbol name="chevron.left" size={24} color="#000" />
                </TouchableOpacity>
                {activeChat.avatar ? (
                  <Image 
                    source={{ uri: activeChat.avatar }} 
                    style={tw`w-10 h-10 rounded-full mr-3`}
                  />
                ) : (
                  <View style={tw`mr-3`}>
                    <AvatarCircle name={mockPizzaPlaces.find(p => p.id === activeChat.placeId)?.name || activeChat.name} />
                  </View>
                )}
                <View style={tw`flex-1`}>
                  <Subheading>{mockPizzaPlaces.find(p => p.id === activeChat.placeId)?.name || activeChat.name}</Subheading>
                  <Caption>
                    {chatGroups.length} members
                  </Caption>
                </View>
                <TouchableOpacity style={tw`ml-2 mr-4`}>
                  <IconSymbol name="ellipsis" size={24} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              contentContainerStyle={tw`p-4`}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
            
            {/* Input Area */}
            <View style={tw`flex-row items-center p-2 border-t border-gray-200 bg-white`}>
              <TouchableOpacity style={tw`p-2 mr-2`}>
                <IconSymbol name="plus.circle.fill" size={24} color="#666" />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={[tw`flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 text-sm`, { fontFamily: 'ClashDisplay' }]}
                placeholder="Message"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <TouchableOpacity 
                style={[tw`p-2 rounded-full`, inputText.trim() === '' ? tw`bg-blue-300` : tw`bg-blue-500`]}
                onPress={handleSendMessage}
                disabled={inputText.trim() === '' || isSending}
              >
                {isSending ? (
                  <View style={tw`h-6 w-6 items-center justify-center`}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : (
                  <IconSymbol name="arrow.up.circle.fill" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
