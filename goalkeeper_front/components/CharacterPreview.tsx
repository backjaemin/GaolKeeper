// components/CharacterPreview.tsx
import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import api from '../src/app'; 

interface CharacterPreviewProps {
  mascot: any;
  background?: any;
  accessories?: any[];
  size?: number;
  style?: ViewStyle;
}

const Z_INDEX_MAP: Record<string, number> = {
  'background': 0, 'body': 10, 'neck': 20, 'face': 30, 'head': 40
};

export const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const serverOrigin = api.defaults.baseURL?.split('/api')[0];
    return `${serverOrigin}${path}`;
  };

const CharacterPreview = ({ mascot, background, accessories = [], size = 120, style }: CharacterPreviewProps) => {

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* 1. 배경 */}
      {background && getImageUrl(background.image_url) && (
        <Image source={{ uri: getImageUrl(background.image_url)! }} style={[styles.layeredImage, { zIndex: 0 }]} resizeMode="contain" />
      )}
      {/* 2. 몸체 */}
      {mascot && getImageUrl(mascot.image_url) && (
        <Image source={{ uri: getImageUrl(mascot.image_url)! }} style={[styles.layeredImage, { zIndex: 10 }]} resizeMode="contain" />
      )}
      {/* 3. 액세서리들 */}
      {accessories.map((acc, index) => (
        <Image 
          key={acc.accessory_id || index} 
          source={{ uri: getImageUrl(acc.image_url)! }} 
          style={[styles.layeredImage, { zIndex: Z_INDEX_MAP[acc.type] || 20 }]} 
          resizeMode="contain"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  layeredImage: { position: 'absolute', width: '100%', height: '100%' },
});

export default CharacterPreview;