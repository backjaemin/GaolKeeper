import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'user_jwt_token';

export const tokenManager = {
  // 토큰 저장
  setToken: async (token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.error('토큰 저장 실패:', e);
    }
  },

  // 토큰 불러오기
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('토큰 불러오기 실패:', e);
      return null;
    }
  },

  // 토큰 삭제 (로그아웃 시 사용)
  clearToken: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('토큰 삭제 실패:', e);
    }
  },
};