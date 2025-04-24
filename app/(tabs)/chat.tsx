import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
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
  ActivityIndicator,
  TouchableWithoutFeedback
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
import { useUser } from '@/contexts/UserContext';
import { loadBrooklynPizzaData } from '@/utils/brooklynPizzaData';  

 
export default function ChatScreen() {
  const { user, userDetails } = useUser();
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
  const [brooklynPizzaData, setBrooklynPizzaData] = useState([]);
  
  const flatListRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const windowWidth = Dimensions.get('window').width;
  
  // Focus the input when a chat is opened
  useEffect(() => {
    if (activeChat) {
      setTimeout(() => {
        // inputRef.current?.focus();
      }, 300); // Wait for animation to complete
    }
  }, [activeChat]);
  
  // Load chat groups when component mounts
  useEffect(() => {
    loadChatGroups();
  }, [placeId]);

  // Real-time subscription for chat groups
  useEffect(() => {
    const chatGroupsSubscription = supabase
      .channel('chat-groups')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Chats'
      }, (payload) => {
        // Reload chat groups when there's any change
        loadChatGroups();
      })
      .subscribe();

    return () => {
      chatGroupsSubscription.unsubscribe();
    };
  }, []);

  // Real-time subscription for messages in active chat
  useEffect(() => {
    if (!activeChat?.placeId) return;

    const messagesSubscription = supabase
      .channel(`messages-${activeChat.placeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ChatMessages',
        filter: `placeId=eq.${activeChat.placeId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = {
            ...payload.new,
            timestamp: moment(payload.new.created_at).format('YYYY-MM-DD HH:mm:ss'),
            isCurrentUser: payload.new.senderId === userDetails?.user_id
          };
          setMessages(prevMessages => [...prevMessages, newMessage]);
          
          // Scroll to bottom for new messages
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          });
        }
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [activeChat?.placeId]);
  

  const loadChatGroups = async () => {
    try {
      setIsLoading(true);
      let brooklynPizzaData = await loadBrooklynPizzaData();  
      setBrooklynPizzaData(brooklynPizzaData.places);
      // If placeId is provided, load specific chat group
      if (placeId) {
        const { data: groups } = await supabase.from('Chats').select('*').eq('placeId', placeId); 
          const placeGroup = mockPizzaPlaces.concat(brooklynPizzaData.places).find(place => place.id === placeId); 
          setChatGroups(groups || []);
          const chatGroup: ChatGroup = {
            placeId,
            name: placeGroup?.name || 'Pizza Place'
          };
          setActiveChat(chatGroup);
          openChat(chatGroup); 
      } else {
        const { data: groups } = await supabase.from('Chats').select('*').order('timestamp', { ascending: false });
        setChatGroups(groups || []);
      }
    } catch (error) {
      console.error('Error loading chat groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      }, 500);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || !activeChat || isSending) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);
    
    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for better UX
    
    try {
      // Send message to the API
      const timestamp = new Date().toISOString();
      const { error } = await supabase.from('ChatMessages').insert({
        text: messageText,
        senderId: userDetails?.user_id || '',
        sender: userDetails?.name || '',
        timestamp,
        avatar: userDetails?.avatar || '', 
        placeId: activeChat.placeId
      });

      if (error) throw error;

      // Update the chat's last message
      await supabase.from('Chats').upsert({
        placeId: activeChat.placeId,
        lastMessage: messageText, 
        timestamp: new Date().toISOString()
      }, {
        onConflict: 'placeId'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error state or retry option
    } finally {
      setIsSending(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    // Light haptic feedback on each keystroke
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openChat = async (chatGroup: ChatGroup) => {
    setActiveChat(chatGroup);
    
    // Update URL params
    // router.replace({
    //   pathname: "/(tabs)/chat",
    //   params: { placeId: chatGroup.placeId }
    // });
    
    // Mark as read
    const updatedGroups = chatGroups.map(group => {
      if (group.placeId === chatGroup.placeId) {
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
          isCurrentUser: item.senderId === userDetails?.user_id
        }
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // setActiveChat(null);
    setMessages([]);
    // loadChatGroups();
    // Clear placeId from URL params
    router.back();
  };

  const renderPlaceName = (placeId: string) => {
    const place = mockPizzaPlaces.concat(brooklynPizzaData).find(p => p.id === placeId);
    return place?.name || place?.displayName?.text || "(Deleted Place)";
  };  
 
  const renderChatGroup = ({ item }: { item: ChatGroup }) => { 
    return <TouchableOpacity 
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
            name={renderPlaceName(item.placeId)} 
            size={48} 
          />
        </View>
      )}
      <View style={tw`flex-1`}>
        <View style={tw`flex-row justify-between items-center`}>
          <Subheading style={tw`text-sm flex-1 mr-2`}>{renderPlaceName(item.placeId)}</Subheading>
          <Caption style={tw`text-xs flex-shrink-0`}>{moment(item.created_at).format('MM/DD HH:mm')}</Caption>
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
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const messageTime = moment(item.timestamp);
    const formattedDate = messageTime.format('MM/DD/YYYY h:mm A');

    return (
      <View style={tw`mb-4`}>
        {/* Username and timestamp row */}
        <View style={tw`flex-row items-center mb-1`}>
          <View style={tw`mr-2`}>
            <AvatarCircle name={item.sender || 'User'} size={32} />
          </View>
          <Text style={[tw`font-semibold text-base `, { fontWeight:"bold" }]}>
            {item.sender || 'User'}
          </Text>
          <Text style={tw`text-xs text-gray-400 ml-2`}>
            {formattedDate}
          </Text>
        </View>

        {/* Message content */}
        <View style={tw`ml-10`}>
          <Text style={[tw`text-base leading-relaxed`, { color: '#2E3338' }]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const AvatarCircle = ({ name, size = 40 }: { name: string; size?: number }) => {
    const initial = name?.charAt?.(0)?.toUpperCase?.();
    
    // Discord's brand colors
    const colors = ['#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245'];
    
    // Generate a consistent hash from the name
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    };

    // Get a consistent color for this user
    const colorIndex = name ? hashString(name) % colors.length : 0;
    const backgroundColor = colors[colorIndex];
    
    return (
      <View style={[
        tw`rounded-full items-center justify-center`,
        {
          width: size,
          height: size,
          backgroundColor
        }
      ]}>
        <Text style={[
          tw`text-white font-bold`,
          { fontSize: size * 0.4 }
        ]}>
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

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <SafeAreaView style={tw`flex-1 bg-[#FFFFFF]`}>
        <StatusBar style="light" />
      
        {/* Chat List View */}
        {/* <Animated.View 
          style={[
            tw`absolute top-0 bottom-0 left-0 right-0 bg-white z-10`,
            chatListTransform
          ]}
        > 
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
        </Animated.View> */}
      
        {/* Chat Detail View */}
        <Animated.View 
          style={[
            tw`absolute top-0 bottom-0 left-0 right-0 bg-[#FFFFFF]`,
            { width: windowWidth },
            chatDetailTransform
          ]}
        >
          {activeChat && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[tw`flex-1`, { width: windowWidth, backgroundColor: '#FFFFFF' }]}
              keyboardVerticalOffset={Platform.OS === 'ios' ? (keyboardVisible ? 0 : 0) : 0}
            >
              {/* Chat Header with Safe Area */}
              <View style={[tw`flex-row items-center border-b border-gray-200 bg-white`, { paddingTop: insets.top }]}>
                <View style={tw`flex-row items-center p-4 w-full`}>
                  <TouchableOpacity onPress={goBack} style={tw`mr-2`}>
                    <IconSymbol name="chevron.left" size={24} color="#000000" />
                  </TouchableOpacity>
                  <View style={tw`flex-1 items-center`}>
                    <Subheading style={[tw`text-center`, { color: '#000000' }]}>
                      {renderPlaceName(activeChat.placeId)}
                    </Subheading> 
                  </View>
                </View>
              </View>
            
              {/* Messages */}
              {!isLoading && messages.length === 0 ? (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={tw`flex-1 items-center justify-center p-4`}>
                    <Image 
                      source={require('@/assets/images/pizza-markers/0.png')}
                      style={tw`w-30 h-30 mb-4`}
                      resizeMode="contain"
                    />
                    <Text style={[tw`text-gray-500 text-center`, { fontFamily: 'Aujournuit' }]}>
                      Be the first one to say something!
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              ) : (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={tw`p-4`}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    style={{ backgroundColor: '#FFFFFF' }}
                  />
                </TouchableWithoutFeedback>
              )}
            
              {/* Input Area */}
              <View style={tw`flex-row items-center p-2 border-t border-gray-200 bg-white ${keyboardVisible? '' : 'mb-6'}`}> 
                <TextInput
                  ref={inputRef}
                  style={[
                    tw`flex-1 rounded-full px-4 py-2 mr-2 text-sm`,
                    { 
                      fontFamily: 'Aujournuit',
                      backgroundColor: '#F2F3F5',
                      color: '#2E3338'
                    }
                  ]}
                  placeholder="Message"
                  placeholderTextColor="#72767D"
                  value={inputText}
                  onChangeText={handleTextChange}
                  multiline
                  maxLength={500}
                  onSubmitEditing={handleSendMessage}
                  returnKeyType="send"
                  blurOnSubmit={false}
                />
                <TouchableOpacity 
                  style={[
                    tw`p-2 rounded-full`,
                    inputText.trim() === '' ? { backgroundColor: '#E3E5E8' } : { backgroundColor: '#5865F2' }
                  ]}
                  onPress={handleSendMessage}
                  disabled={inputText.trim() === '' || isSending}
                >
                  {isSending ? (
                    <View style={tw`h-6 w-6 items-center justify-center`}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  ) : (
                    <IconSymbol name="arrow.up" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </Animated.View>
      </SafeAreaView>
    </>
  );
}
