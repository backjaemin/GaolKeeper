import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 구글 및 카카오 SDK 임포트
import {
  GoogleSignin
} from '@react-native-google-signin/google-signin';

import { unlink } from '@react-native-kakao/user';

export default function ConfigScreen() {
  const router = useRouter();

  // 1. 알림 설정 상태 관리 (기존 코드 유지)
  const [pushAlarm, setPushAlarm] = useState(true);
  const [deadlineAlarm, setDeadlineAlarm] = useState(true);
  const [commentAlarm, setCommentAlarm] = useState(true);
  const [likeAlarm, setLikeAlarm] = useState(true);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  // 계정 정보 이동 핸들러
  const navigateToAccountInfo = () => {
    // router.push('/settings/account'); // 경로 생성 시 주석 해제
  };

  // 2. 통합 회원탈퇴 핸들러 (구글 + 카카오)
  const handleWithdrawal = async () => {
    Alert.alert(
      "회원탈퇴",
      "정말로 탈퇴하시겠습니까? 모든 데이터와 계정 연결이 삭제됩니다.",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "탈퇴하기", 
          style: "destructive",
          onPress: async () => {
            try {
              console.log('회원탈퇴 프로세스 시작');

              // [A] 구글 연결 해제 프로세스
              const user = await GoogleSignin.getCurrentUser();
              if (user) {
                await GoogleSignin.revokeAccess(); // 구글 서버와의 앱 연결 끊기
                await GoogleSignin.signOut();     // 기기 내 로그아웃
                console.log('Google 계정 탈퇴 완료');
              }

              // [B] 카카오 연결 해제 프로세스
              try {
                // 카카오는 로그인 세션이 만료되었을 수도 있으므로 try-catch로 감쌉니다.
                await unlink(); 
                console.log('Kakao 계정 탈퇴 완료');
              } catch (kakaoError) {
                console.log('카카오 탈퇴 처리 건너뜀 (이미 로그아웃 상태 등)');
              }

              // [C] 백엔드(FastAPI) 연동 포인트
              // TODO: await fetch('https://your-api.com/user/withdraw', { method: 'DELETE' });

              Alert.alert("탈퇴 완료", "성공적으로 회원탈퇴 처리되었습니다.", [
                { text: "확인", onPress: () => router.replace('/') }
              ]);

            } catch (error) {
              
              console.error('탈퇴 처리 중 에러:', error);
              Alert.alert("에러", "회원탈퇴 처리 중 문제가 발생했습니다.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <View style={styles.headerIconPlaceholder} /> 
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerIconPlaceholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 내 계정 섹션 */}
        <Text style={styles.sectionTitle}>내 계정</Text>
        <SettingRow
          label="계정 정보"
          onPress={navigateToAccountInfo}
          showChevron={true}
        />

        {/* 알림 섹션 */}
        <Text style={styles.sectionTitle}>알림</Text>
        <SettingRow
          label="푸시 알림"
          isToggle={true}
          value={pushAlarm}
          onValueChange={setPushAlarm}
        />
        <SettingRow
          label="데드라인 알림"
          isToggle={true}
          value={deadlineAlarm}
          onValueChange={setDeadlineAlarm}
        />
        <SettingRow
          label="댓글 알림"
          isToggle={true}
          value={commentAlarm}
          onValueChange={setCommentAlarm}
        />
        <SettingRow
          label="좋아요 알림"
          isToggle={true}
          value={likeAlarm}
          onValueChange={setLikeAlarm}
        />
        <SettingRow
          label="방해 금지 모드"
          isToggle={true}
          value={doNotDisturb}
          onValueChange={setDoNotDisturb}
        />

        {/* 회원탈퇴 버튼 영역 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.withdrawalButton} onPress={handleWithdrawal}>
            <Text style={styles.withdrawalButtonText}>회원탈퇴</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- 공통 컴포넌트: SettingRow ---
interface SettingRowProps {
  label: string;
  isToggle?: boolean;
  value?: boolean;
  onValueChange?: (val: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
}

const SettingRow = ({ label, isToggle, value, onValueChange, onPress, showChevron }: SettingRowProps) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={isToggle}
    activeOpacity={0.7}
  >
    <Text style={styles.rowLabel}>{label}</Text>
    <View style={styles.rowRight}>
      {isToggle ? (
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={onValueChange}
          value={value}
        />
      ) : null}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </View>
  </TouchableOpacity>
);

// --- 스타일 정의 ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIconPlaceholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 24,
    marginBottom: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: {
    fontSize: 16,
    color: '#333',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 40,
    marginBottom: 50,
    alignItems: 'center',
  },
  withdrawalButton: {
    width: '100%',
    backgroundColor: '#ff5c5c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});