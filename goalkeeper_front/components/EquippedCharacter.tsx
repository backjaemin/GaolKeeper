// components/EquippedCharacter.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useEquippedItems } from '../hooks/useEquippedItems';
import CharacterPreview from './CharacterPreview';

interface EquippedCharacterProps {
  size?: number;
}

const EquippedCharacter = ({ size = 120 }: EquippedCharacterProps) => {
  const { data, loading } = useEquippedItems(); // 🚀 스스로 데이터를 불러옴!

  if (loading) return <ActivityIndicator size="small" color="#000" style={{ width: size, height: size }} />;
  if (!data) return null;

  return (
    <CharacterPreview 
      mascot={data.mascot}
    //   background={data.background}
      accessories={data.accessories}
      size={size}
    />
  );
};

export default EquippedCharacter;


