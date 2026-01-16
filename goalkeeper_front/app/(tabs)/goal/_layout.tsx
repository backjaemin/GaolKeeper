import { Stack } from 'expo-router';

export default function GoalLayout() {
  return (
    <Stack>
      {/* 목표 화면 (index.tsx) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* 목표 추가 화면 */}
      <Stack.Screen name="addgoal" options={{ headerShown: false }} />

      {/* 목표 수정 화면 */}
      <Stack.Screen name="editgoal" options={{ headerShown: false }} />
    </Stack>
  );
}
