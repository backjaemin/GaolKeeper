import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { tokenManager } from '../src/utils/tokenManager';

export default function RootLayout() {
  // const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        // 1. 보안 저장소에서 토큰을 꺼내옵니다.
        const token = await tokenManager.getToken();

        // 2. 토큰이 있다면 즉시 홈 화면으로 보냅니다.
        if (token) {
          console.log('자동 로그인 성공: 토큰 발견');
          // replace를 사용해야 뒤로가기를 눌러도 로그인 페이지로 안 돌아옵니다.
          router.replace('/(tabs)/home');
        }
      } catch (e) {
        console.error('자동 로그인 체크 중 에러:', e);
      } finally {
        // 3. 체크가 끝나면 화면을 보여줍니다.
        // setIsChecking(false);
        // 무한루프오류
      }
    };

    checkAutoLogin();
  }, []);

  // 체크 중일 때 하얀 화면이나 로딩 스피너를 보여줘서 
  // 로그인 화면이 잠깐 보였다가 사라지는 '깜빡임' 현상을 방지합니다.
  // if (isChecking) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" color="#3E3E3E" />
  //     </View>
  //   );
  // }

  return (
    <Stack>
      {/* 로그인 화면 (index.tsx) - 헤더 숨김 */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      
      {/* 메인 탭 화면 ((tabs) 폴더) - 헤더 숨김 */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}