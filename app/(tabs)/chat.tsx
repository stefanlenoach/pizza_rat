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
          const placeGroup = mockPizzaPlaces.concat(brooklynPizzaData.places).find(place => place.id === placeId); 
          setChatGroups(groups || []);
          setActiveChat({ placeId, name: placeGroup?.name || placeGroup?.displayName?.text || '' });
          openChat({ placeId, name: placeGroup?.name || placeGroup?.displayName?.text || ''  });
        } 
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

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <StatusBar style="dark" />
      
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
            tw`absolute top-0 bottom-0 left-0 right-0 bg-white`,
            { width: windowWidth },
            chatDetailTransform
          ]}
        >
          {activeChat && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[tw`flex-1`, { width: windowWidth }]}
              keyboardVerticalOffset={Platform.OS === 'ios' ? (keyboardVisible ? 0 : 0) : 0}
            >
              {/* Chat Header with Safe Area */}
              <View style={[tw`flex-row items-center border-b border-gray-200 bg-white`, { paddingTop: insets.top }]}>
                <View style={tw`flex-row items-center p-4 w-full`}>
                  <TouchableOpacity onPress={goBack} style={tw`mr-2`}>
                    <IconSymbol name="chevron.left" size={24} color="#000" />
                  </TouchableOpacity>
                  {/* {activeChat.avatar ? (
                    <Image 
                      source={{ uri: activeChat.avatar }} 
                      style={tw`w-10 h-10 rounded-full mr-3`}
                    />
                  ) : (
                    <View style={tw`mr-3`}>
                      <AvatarCircle name={renderPlaceName(activeChat.placeId)} />
                    </View>
                  )} */}
                  <View style={tw`flex-1 items-center`}>
                    <Subheading style={tw`text-center`}>{renderPlaceName(activeChat.placeId)}</Subheading> 
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
                  />
                </TouchableWithoutFeedback>
              )}
            
              {/* Input Area */}
              <View style={tw`flex-row items-center p-2 border-t border-gray-200 bg-white ${keyboardVisible? '' : 'mb-6'}`}> 
                <TextInput
                  ref={inputRef}
                  style={[tw`flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 text-sm`, { fontFamily: 'Aujournuit' }]}
                  placeholder="Message"
                  value={inputText}
                  onChangeText={handleTextChange}
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
