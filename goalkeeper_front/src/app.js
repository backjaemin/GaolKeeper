import axios from 'axios';
import { tokenManager } from './utils/tokenManager';
import { router } from 'expo-router';

const BASE_URL = 'http://172.21.250.201:8000';

const api = axios.create({
  baseURL: BASE_URL, // PC IP
});

// 2. [요청 검문소] 서버로 가기 전에 가로채기
api.interceptors.request.use(
  async (config) => {
    // 저장소에서 토큰을 꺼내옵니다. (비동기 처리)
    const token = await tokenManager.getToken();
    
    // 토큰이 있다면 모든 요청 헤더에 'Bearer 토큰값'을 주입합니다.
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('요청 인터셉터 작동: 헤더에 토큰 주입됨');
    return config; // 수정된 요청을 서버로 보냅니다.
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. [응답 검문소] 앱에 도착하기 전에 가로채기
api.interceptors.response.use(
  (response) => {
    // 200번대 정상 응답은 그냥 통과!
    return response;
  },
  async (error) => {
    // 서버 응답 에러가 발생했을 때 (예: 401 Unauthorized)
    if (error.response && error.response.status === 401) {
      console.log('토큰이 만료되었거나 유효하지 않습니다.');
      
      // 저장된 토큰을 지우고 로그인 화면으로 보냅니다.
      await tokenManager.clearToken();
      router.replace('/'); 
    }
    return Promise.reject(error);
  }
);

export default api;