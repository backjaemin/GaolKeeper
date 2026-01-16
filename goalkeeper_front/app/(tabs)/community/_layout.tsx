import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack>
      {/* 1. 게시글 목록 (메인) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      
      {/* 2. 글쓰기 페이지 */}
      <Stack.Screen name="uploadpost" options={{ headerShown: false }} />

      {/* 3. [추가] 게시글 상세 페이지 (동적 라우팅) */}
      <Stack.Screen name="[id]" options={{ headerShown: false }} />

      {/* 4. [추가] 게시글 수정 페이지 */}
      <Stack.Screen name="editpost" options={{ headerShown: false }} />
    </Stack>
  );
}