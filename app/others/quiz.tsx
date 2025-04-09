import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Alert, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sample quiz data - replace with your actual music samples and answers
const quizQuestions = [
  {
    id: 1,
    audioSource: require('@/assets/sounds/quiz-sound.mp3'),
    question: "What genre is this music?",
    options: ["Jazz", "Rock", "Classical", "Electronic"],
    correctAnswer: "Jazz"
  }
];

export default function QuizScreen() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPassedQuiz, setHasPassedQuiz] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if user has already passed the quiz
    checkQuizStatus();
    
    // Load the audio file
    loadAudio();
    
    // Cleanup function
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [currentQuestion]);
  
  const checkQuizStatus = async () => {
    try {
      const quizPassed = await AsyncStorage.getItem('pizza_rat_quiz_passed');
      setHasPassedQuiz(quizPassed === 'true');
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking quiz status:', error);
      setIsLoading(false);
    }
  };
  
  const loadAudio = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        quizQuestions[currentQuestion].audioSource,
        { shouldPlay: false }
      );
      
      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Failed to load audio sample. Please try again.');
      setIsLoading(false);
    }
  };
  
  const playSound = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.stopAsync();
          setIsPlaying(false);
        } else {
          // Reset the sound position to the beginning before playing
          await sound.setPositionAsync(0);
          await sound.playAsync();
          setIsPlaying(true);
          
          // Add listener to set isPlaying to false when audio finishes
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      Alert.alert('Error', 'Failed to play audio sample. Please try again.');
    }
  };
  
  const handleAnswer = (selectedAnswer: string) => {
    const correctAnswer = quizQuestions[currentQuestion].correctAnswer;
    
    if (selectedAnswer === correctAnswer) {
      if (currentQuestion < quizQuestions.length - 1) {
        // Move to next question
        setIsLoading(true);
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // User passed the quiz
        markQuizAsPassed();
        Alert.alert(
          'Congratulations!',
          'You have successfully passed the quiz!',
          [{ text: 'Continue to App', onPress: () => router.push('/') }]
        );
      }
    } else {
      // User failed the quiz
      Alert.alert(
        'Access Denied',
        'Sorry, your answer was incorrect. You cannot access the app.',
        [{ text: 'OK', onPress: () => router.push('/') }]
      );
    }
  };
  
  const markQuizAsPassed = async () => {
    try {
      await AsyncStorage.setItem('pizza_rat_quiz_passed', 'true');
      setHasPassedQuiz(true);
    } catch (error) {
      console.error('Error saving quiz status:', error);
    }
  };
  
  const resetQuiz = async () => {
    try {
      await AsyncStorage.removeItem('pizza_rat_quiz_passed');
      setHasPassedQuiz(false);
      setCurrentQuestion(0);
      setIsLoading(true);
      loadAudio();
    } catch (error) {
      console.error('Error resetting quiz status:', error);
    }
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B5563" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }
  
  if (hasPassedQuiz) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Quiz', headerShown: false }} />
        
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.contentContainer}>
          <Ionicons name="checkmark-circle" size={80} color="green" />
          <Text style={styles.titleText}>Quiz Passed</Text>
          <Text style={styles.descriptionText}>
            You've already passed the quiz and have full access to the app.
          </Text>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetQuiz}
          >
            <Text style={styles.resetButtonText}>Reset Quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Quiz', headerShown: false }} />
      
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={24} color="#333" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>Quiz</Text>
        <Text style={styles.descriptionText}>
          Listen to the music sample and answer the question correctly to access the app.
        </Text>
        
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            Question
          </Text>
          <Text style={styles.questionPrompt}>{quizQuestions[currentQuestion].question}</Text>
          
          <TouchableOpacity
            style={[styles.playButton, isPlaying ? styles.stopButton : null]}
            onPress={playSound}
          >
            <Ionicons
              name={isPlaying ? "stop" : "play"}
              size={30}
              color="white"
            />
            <Text style={styles.playButtonText}>
              {isPlaying ? "Stop Audio" : "Play Audio"}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.optionsContainer}>
            {quizQuestions[currentQuestion].options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
  },
  backButton: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 10,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 30,
  },
  questionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  questionPrompt: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC4899',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  playButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'white',
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  resetButtonText: {
    fontSize: 16,
    color: 'white',
  },
});