import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/CustomText';
import BottomSheet, { BottomSheetBackdrop,BottomSheetScrollView } from '@gorhom/bottom-sheet';
import tw from '@/utils/tw';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface UserBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  setSearchModalVisible?: (value: boolean) => void;
  userId: string;
  
}

const UserBottomSheet: React.FC<UserBottomSheetProps> = ({
  isVisible,
  onClose,
  userId, 
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const router = useRouter();
 
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!isVisible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 1 : -1}
      snapPoints={['20%']}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
    >
      <BottomSheetScrollView contentContainerStyle={tw`pb-10 flex-1 justify-center items-center p-4`}>
        <TouchableOpacity 
          style={tw`flex-row items-center justify-center bg-pink-500 rounded-md py-3 px-8`}
          onPress={() => {
            onClose();
            router.push('/chat' as any);
          }}
        >
          <Ionicons name="chatbubbles" size={24} color="white" style={tw`mr-2`} />
          <Text style={tw`text-white font-medium text-lg`}>Chat</Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  indicator: {
    backgroundColor: '#CCCCCC',
    width: 40,
  }
});

export default UserBottomSheet;
