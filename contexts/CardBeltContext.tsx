import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define a card type with abilities
export interface CardAbility {
  name: string;
  description: string;
  isActive: boolean;
}

export interface TradingCard {
  id: string;
  name: string;
  abilities: CardAbility[];
  attack: number;
  defense: number;
  imageUrl?: string;
  rarity: string;
  collectorNumber: string;
  flavorText: string;
}

interface CardBeltContextType {
  beltCards: TradingCard[];
  addCardToBelt: (card: TradingCard) => void;
  removeCardFromBelt: (cardId: string) => void;
  isCardInBelt: (cardId: string) => boolean;
  maxBeltSize: number;
}

const CardBeltContext = createContext<CardBeltContextType | undefined>(undefined);

interface CardBeltProviderProps {
  children: ReactNode;
  maxBeltSize?: number;
}

export const CardBeltProvider = ({ 
  children, 
  maxBeltSize = 3 
}: CardBeltProviderProps) => {
  const [beltCards, setBeltCards] = useState<TradingCard[]>([]);

  const addCardToBelt = (card: TradingCard) => {
    if (beltCards.length < maxBeltSize && !isCardInBelt(card.id)) {
      setBeltCards([...beltCards, {...card, abilities: card.abilities.map(ability => ({...ability, isActive: true}))}]);
    }
  };

  const removeCardFromBelt = (cardId: string) => {
    setBeltCards(beltCards.filter(card => card.id !== cardId));
  };

  const isCardInBelt = (cardId: string) => {
    return beltCards.some(card => card.id === cardId);
  };

  return (
    <CardBeltContext.Provider value={{ 
      beltCards, 
      addCardToBelt, 
      removeCardFromBelt, 
      isCardInBelt,
      maxBeltSize 
    }}>
      {children}
    </CardBeltContext.Provider>
  );
};

export const useCardBelt = () => {
  const context = useContext(CardBeltContext);
  if (context === undefined) {
    throw new Error('useCardBelt must be used within a CardBeltProvider');
  }
  return context;
};