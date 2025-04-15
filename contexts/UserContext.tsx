import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { registerForPushNotifications } from '../lib/notifications';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

interface UserDetails {
  user_id: string;
  name: string;
  email: string;
  push_token?: string;
}

interface Review {
  id: string;
  rate: number;
  content: string;
  placeId: string;
  userId: string;
  created_at: string;
  user?: {
    email: string;
    avatar_url?: string;
  };
}

interface PlaceReviews {
  [placeId: string]: {
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
    rating: number;
  };
}

interface PlaceResult {
  // Add properties of PlaceResult here
}

interface UserContextType {
  user: User | null;
  session: Session | null;
  userDetails: UserDetails | null;
  loading: boolean;
  placeReviews: PlaceReviews;
  refreshReviews: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  searchModalVisible: boolean;
  setSearchModalVisible: (visible: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSearchPlace: PlaceResult | null;
  setSelectedSearchPlace: (place: PlaceResult | null) => void;
  filterVisible: boolean;
  setFilterVisible: (visible: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [placeReviews, setPlaceReviews] = useState<PlaceReviews>({});
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchPlace, setSelectedSearchPlace] = useState<PlaceResult | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);

  const loadUserDetails = async (userId: string) => {
    try {
      // Load user details
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('user_id, name, email')
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;
      
      // Load latest push token
      const { data: tokenData } = await supabase
        .from('PushTokens')
        .select('token')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setUserDetails({
        ...userData,
        push_token: tokenData?.token || null
      });

      // Request push notification permissions and update token if needed
      if (!tokenData?.token) {
        try{
          const token = await registerForPushNotifications();
          console.log("token",token)
          if (token) {
            const { error: insertError } = await supabase
              .from('PushTokens')
              .upsert({ 
                user_id: userId,
                token,
                created_at: new Date().toISOString()
              },
            {
              onConflict: 'token'
            });
  
            if (!insertError) {
              setUserDetails(prev => prev ? { ...prev, push_token: token } : null);
            }
          }
        } catch (error) {
          console.error('Error registering for push notifications:', error);
        }
       
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      setUserDetails(null);
    }
  };

  const loadReviews = async () => {
    try {
      const { data: reviews, error } = await supabase
        .from('Review')
        .select(`
          *,
          user:userId (
            email
          )
        `)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      // Organize reviews by placeId
      const reviewsByPlace: PlaceReviews = {};
      reviews.forEach((review: Review) => {
        if (!reviewsByPlace[review.placeId]) {
          reviewsByPlace[review.placeId] = {
            reviews: [],
            averageRating: 0,
            totalReviews: 0,
            rating: 0
          };
        }
        reviewsByPlace[review.placeId].reviews.push(review);
        
        // Calculate average rating
        const totalRating = reviewsByPlace[review.placeId].reviews.reduce((sum, r) => sum + r.rate, 0);
        const numReviews = reviewsByPlace[review.placeId].reviews.length;
        reviewsByPlace[review.placeId].rating = totalRating / numReviews;
        reviewsByPlace[review.placeId].averageRating = totalRating / numReviews;
        reviewsByPlace[review.placeId].totalReviews = numReviews;
      });

      setPlaceReviews(reviewsByPlace);
    } catch (error) {
      console.error('Error in loadReviews:', error);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserDetails(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserDetails(session.user.id);
      } else {
        setUserDetails(null);
      }
      setLoading(false);
    });

    // Load initial reviews
    loadReviews();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'pizzarat://login',
          skipBrowserRedirect: true,
        }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No URL returned from Supabase');

      const response = await WebBrowser.openAuthSessionAsync(
        data.url,
        'pizzarat://login'
      );

      if (response.type === 'success') {
        const { url } = response;
        await supabase.auth.setSession({
          access_token: url.split('access_token=')[1].split('&')[0],
          refresh_token: url.split('refresh_token=')[1].split('&')[0]
        });

        const { data: { session } } = await supabase.auth.getSession();
        
 
        await supabase
          .from('Users')
          .upsert([
            {
              user_id: session?.user?.id,
              email: session?.user?.email,
              name: session?.user?.user_metadata.name,
            }
          ],{
            onConflict:'user_id'
          });
 
        return { error: null };
      }

      return { error: new Error('Browser session failed') };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithApple = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'pizzarat://login',
          skipBrowserRedirect: true,
        }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No URL returned from Supabase');

      const response = await WebBrowser.openAuthSessionAsync(
        data.url,
        'pizzarat://login'
      );

      if (response.type === 'success') {
        const { url } = response;
        await supabase.auth.setSession({
          access_token: url.split('access_token=')[1].split('&')[0],
          refresh_token: url.split('refresh_token=')[1].split('&')[0]
        });

        const { data: { session } } = await supabase.auth.getSession();
        
        // Create or update user profile
        await supabase
          .from('Users')
          .upsert([
            {
              user_id: session?.user?.id,
              email: session?.user?.email,
              name: session?.user?.user_metadata.name || session?.user?.email?.split('@')[0],
            }
          ], {
            onConflict: 'user_id'
          });

        return { error: null };
      }

      return { error: new Error('Browser session failed') };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) return { error: signUpError };
      if (!authData.user) return { error: new Error('Failed to create user') };

      // 2. Insert user data into Users table
      const { error: insertError } = await supabase
        .from('Users')
        .insert([
          {
            user_id: authData.user.id,
            email: email,
            name: name,
          }
        ]);

      if (insertError) return { error: insertError };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Delete all push tokens for the user before signing out
      if (user?.id) {
        const { error: deleteError } = await supabase
          .from('PushTokens')
          .delete()
          .eq('user_id', user.id);
          
        if (deleteError) {
          console.error('Error deleting push tokens:', deleteError);
        }
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      // if (error) throw error;
      
      // Clear local user state
      setUser(null);
      setSession(null);
      setUserDetails(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshReviews = async () => {
    await loadReviews();
  };
 

  const value = {
    user,
    session,
    userDetails,
    loading,
    placeReviews,
    refreshReviews,
    signIn,
    searchModalVisible,
    setSearchModalVisible,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    searchQuery,
    setSearchQuery,
    selectedSearchPlace,
    setSelectedSearchPlace,
    filterVisible,
    setFilterVisible
  };

  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
