import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from '@/components/CustomText';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/utils/tw';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    profile?: {
      username?: string;
    };
  };
}

interface RawChatData {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
  };
}

export default function ChatScreen() {
  const { id: otherUserId } = useLocalSearchParams();
  const { session } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data: chatData, error: chatError } = await supabase
        .from('UserChats')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at
        `)
        .or(`and(sender_id.eq.${session?.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${session?.user.id})`)
        .order('created_at', { ascending: true });

      if (chatError) {
        console.error('Error fetching messages:', chatError);
        return;
      }

      // Transform the data to match the Message type
      const transformedMessages = (chatData || []).map((rawMsg: any) => {
        const msg: RawChatData = {
          id: rawMsg.id,
          sender_id: rawMsg.sender_id,
          receiver_id: rawMsg.receiver_id,
          content: rawMsg.content,
          created_at: rawMsg.created_at,
          sender: {
            id: rawMsg.sender?.id,
            username: rawMsg.sender?.username
          }
        };

        return {
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          content: msg.content,
          created_at: msg.created_at,
          sender: {
            id: msg.sender.id,
            username: msg.sender.username
          }
        };
      });

      setMessages(transformedMessages);
    };

    const fetchOtherUser = async () => {
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', otherUserId)
        .single();

      if (error) {
        console.error('Error fetching other user:', error);
        return;
      }

      setOtherUser(data);
    };

    fetchMessages();
    fetchOtherUser();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${session?.user.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'UserChats',
          // filter: `or(and(sender_id.eq.${session?.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${session?.user.id}))`
        },
        (payload) => {
          if(payload?.new?.sender_id === session?.user.id || payload?.new?.receiver_id === session?.user.id) {
            setMessages((prev) => [...prev, payload.new as Message]);
          } 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id, otherUserId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.user.id) return;

    const payload = {
      sender_id: session.user.id,
      receiver_id: otherUserId,
      content: newMessage.trim()
    }
 
    const { error } = await supabase
      .from('UserChats')
      .insert(payload); 
    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setNewMessage('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === session?.user.id;

    return (
      <View style={[
        tw`rounded-lg px-3 py-2 my-1 max-w-[80%]`,
        isOwnMessage ? tw`bg-pink-500 self-end` : tw`bg-gray-200 self-start`
      ]}>
        <Text style={[
          tw`text-base`,
          isOwnMessage ? tw`text-white` : tw`text-gray-800`
        ]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: otherUser?.username || 'Chat',
          headerBackTitle: 'Back'
        }}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1 bg-white`}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`p-4`}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        <View style={tw`p-4 border-t border-gray-200 flex-row items-center`}>
          <TextInput
            style={tw`flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2`}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim()}
            style={[
              tw`rounded-full p-2`,
              !newMessage.trim() ? tw`bg-gray-300` : tw`bg-pink-500`
            ]}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color="white"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
