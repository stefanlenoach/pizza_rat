import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Paths that don't require quiz passage
const EXEMPT_PATHS = ['/quiz', '/settings'];

export function QuizGate({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPassedQuiz, setHasPassedQuiz] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    checkQuizStatus();
  }, []);
  
  const checkQuizStatus = async () => {
    try {
      const quizPassed = await AsyncStorage.getItem('pizza_rat_quiz_passed');
      const hasPassedQuiz = quizPassed === 'true';
      setHasPassedQuiz(hasPassedQuiz);
      
      // If user hasn't passed the quiz and isn't on an exempt path, redirect to quiz
      if (!hasPassedQuiz && !EXEMPT_PATHS.some(path => pathname.startsWith(path))) {
        router.replace('/others/quiz');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking quiz status:', error);
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4B5563" />
      </View>
    );
  }
  
  // If on an exempt path or has passed the quiz, render children
  if (EXEMPT_PATHS.some(path => pathname.startsWith(path)) || hasPassedQuiz) {
    return <>{children}</>;
  }
  
  // This shouldn't be reached due to the redirect, but just in case
  return null;
}