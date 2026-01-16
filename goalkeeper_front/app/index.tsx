import { tokenManager } from '@/src/utils/tokenManager';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../src/app';

// 카카오 SDK
import { getKeyHashAndroid, initializeKakaoSDK } from "@react-native-kakao/core";
import { login } from '@react-native-kakao/user';

// 구글 로그인 SDK [00:04:50 참고]
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes
} from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const router = useRouter();
  const [isInProgress, setIsInProgress] = useState(false); // 로그인 진행 상태 관리

  useEffect(() => {
    // 1. 카카오 초기화
    initializeKakaoSDK('b6c480ef45dfffc865dda75b99e2cccf');
    getKeyHashAndroid().then(console.log);

    // 2. 구글 로그인 초기 설정
    GoogleSignin.configure({
      // ⚠️ 여기에 구글 클라우드 콘솔에서 만든 웹 클라이언트 ID를 넣으세요
      webClientId: '608952459242-pdhcifcrc01egbvb8i0sd065timma5t4.apps.googleusercontent.com', 
      offlineAccess: true,
    });
  }, []);

  // --- 카카오 로그인 로직 ---
  const handleKakaoLogin = async () => {
    try {
      const result = await login();
      console.log('SDK Access Token:', result.accessToken);
      const response = await api.post('/auth/kakao', { token: result.accessToken });

      console.log('백엔드 로그인 성공');
      const { access_token } = response.data;
        if (access_token) {
          await tokenManager.setToken(access_token);
          console.log('JWT 저장 완료')
          router.replace('/(tabs)/home');
        }
    } catch (error) {
      console.error('Kakao Login Error:', error);
    }
  };

  // --- 구글 로그인 로직 ---
  const handleGoogleLogin = async () => {
    setIsInProgress(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        // 백엔드(FastAPI)로 보낼 idToken을 여기서 얻을 수 있습니다.
        const { idToken } = response.data;
        console.log('Google ID Token:', idToken);
        const res = await api.post('/auth/google', { token: idToken });

        console.log('백엔드 로그인 성공:', res.data);
        const { access_token } = res.data;

        if (access_token) {
          await tokenManager.setToken(access_token);
          console.log('JWT 저장 완료')
          router.replace('/(tabs)/home');
        }
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log('사용자가 취소했습니다.');
            break;
          case statusCodes.IN_PROGRESS:
            console.log('이미 진행 중입니다.');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('에러', '구글 플레이 서비스를 사용할 수 없습니다.');
            break;
          default:
            Alert.alert('에러', error.message);
        }
      } else {
        console.error('비구글 관련 에러:', error);
      }
    } finally {
      setIsInProgress(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. 로고 영역 */}
      <View style={styles.contentContainer}>
        <Image
          source={require('@/assets/images/logo.png')} 
          style={styles.logoImage}
        />
      </View>

      {/* 2. 로그인 버튼 영역 */}
      <View style={styles.buttonContainer}>
        {/* 기존 카카오(일반) 로그인 버튼 */}
        <TouchableOpacity style={styles.loginButton} onPress={handleKakaoLogin}>
          <Text style={styles.loginButtonText}>카카오 로그인</Text>
        </TouchableOpacity>

        {/* 구글 로그인 버튼 추가 */}
        <GoogleSigninButton
          style={styles.googleSigninButton}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={handleGoogleLogin}
          disabled={isInProgress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#3E3E3E',
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 4,
    marginBottom: 12, // 구글 버튼과의 간격
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleSigninButton: {
    width: '100%',
    height: 60, // 구글 버튼은 height를 명시해주는 것이 좋습니다.
  },
});