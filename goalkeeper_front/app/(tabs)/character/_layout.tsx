import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack>
      {/* 게시글 화면 (index.tsx) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      
      {/* 게시글 추가 화면 */}
      <Stack.Screen name="decorate" options={{ headerShown: false }} />
    </Stack>
  );
}
