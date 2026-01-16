import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../src/app'; 

const { width } = Dimensions.get('window');

// 데이터 타입 정의
interface Character {
  id: number;
  name: string;
  description: string;
  isMain: boolean;   // 현재 장착 중인가?
  isOwned: boolean;  // 내가 샀는가?
  price: number;
  imageUrl: string;        // 밝은 이미지
  lockedImageUrl?: string | null; // 🟢 [추가] 어두운 이미지
}

// 이미지 URL 처리 함수
const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const serverOrigin = api.defaults.baseURL?.split('/api')[0];
  return `${serverOrigin}${path}`;
};

// 🟢 [개별 캐릭터 아이템 컴포넌트]
const CharacterItem = ({ 
  character, 
  onEquip,
  onBuy // 🟢 구매 함수 추가
}: { 
  character: Character; 
  onEquip: (id: number) => Promise<void>;
  onBuy: (character: Character) => void; // 구매 핸들러
}) => {
  const router = useRouter();

  // 🟢 [핵심 로직] 보유 여부에 따라 이미지 결정
  // 보유중이면 -> 밝은 이미지
  // 미보유면 -> 어두운 이미지 (없으면 그냥 밝은거)
  const targetPath = character.isOwned 
      ? character.imageUrl 
      : (character.lockedImageUrl || character.imageUrl);
      
  const fullUrl = getImageUrl(targetPath);

  // "꾸미기" 버튼 로직
  const handleDecoratePress = async () => {
    if (!character.isOwned) {
      Alert.alert("알림", "먼저 캐릭터를 구매해야 꾸밀 수 있어요!");
      return;
    }
    if (!character.isMain) {
      await onEquip(character.id); 
    }
    router.push('/(tabs)/character/decorate'); // 경로 수정됨
  };

  return (
    <View style={styles.characterRow}>
      {/* 캐릭터 이미지 (어둠/빛 적용됨) */}
      <View style={styles.imageWrapper}>
          <Image 
            source={ fullUrl ? { uri: fullUrl } : undefined } 
            style={[
                styles.characterImage, 
                !character.isOwned && { tintColor: undefined } // 필요시 여기서 추가 스타일링 가능
            ]} 
            resizeMode="contain"
          />
      </View>

      {/* 캐릭터 정보 */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.characterName}>{character.name}</Text>
          
          {/* 상태 뱃지 */}
          {character.isMain && (
            <View style={[styles.badge, styles.mainBadge]}>
              <Text style={styles.badgeText}>★ 대표</Text>
            </View>
          )}
          {character.isOwned && !character.isMain && (
            <View style={[styles.badge, styles.ownedBadge]}>
              <Text style={styles.badgeText}>보유중</Text>
            </View>
          )}
          {!character.isOwned && (
             <View style={[styles.badge, styles.priceBadge]}>
               <Text style={styles.badgeText}>NEW</Text> 
             </View>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {character.description || "설명이 없습니다."}
        </Text>

        <View style={styles.buttonRow}>
          {/* 1. 꾸미기 버튼 (미보유시 비활성 처리 시각적 효과) */}
          <TouchableOpacity 
            style={[styles.actionButton, !character.isOwned && { opacity: 0.5 }]} 
            activeOpacity={0.7} 
            onPress={handleDecoratePress}
            disabled={!character.isOwned}
          >
            <Text style={styles.buttonText}>꾸미기 {'>'}</Text>
          </TouchableOpacity>

          {/* 2. 우측 버튼 (상황에 따라 다름) */}
          {character.isOwned ? (
              // 보유중 -> 착용하기 (이미 착용중이면 '장착중')
              !character.isMain ? (
                <TouchableOpacity 
                  style={[styles.actionButton, { marginLeft: 0 }]} 
                  activeOpacity={0.7}
                  onPress={() => onEquip(character.id)}
                >
                  <Text style={styles.buttonText}>짝꿍 {'>'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.actionButton, { backgroundColor: '#f0f0f0', borderColor: 'transparent' }]}>
                    <Text style={{color:'#aaa', fontSize:12}}>장착중</Text>
                </View>
              )
          ) : (
              // 미보유 -> 구매하기 (가격 표시)
              <TouchableOpacity 
                  style={[styles.actionButton, styles.buyButton]} 
                  activeOpacity={0.7}
                  onPress={() => onBuy(character)}
                >
                  <Text style={[styles.buttonText, {color: '#fff', fontWeight:'bold'}]}>
                      {character.price} 코인
                  </Text>
              </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// 🟢 [메인 화면 컴포넌트]
export default function CharacterScreen() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [myCash, setMyCash] = useState(0);
  const [loading, setLoading] = useState(true);

  // 캐릭터 장착(교체) 함수
  const handleEquip = async (mascotId: number) => {
    try {
      await api.post(`/mascots/${mascotId}/equip`);
      await fetchData(); 
    } catch (error) {
      console.error("장착 실패:", error);
      Alert.alert("오류", "캐릭터 장착에 실패했습니다.");
    }
  };

  // 🟢 구매 함수 추가
  const handleBuy = async (item: Character) => {
      Alert.alert("캐릭터 입양", `${item.name}을(를) ${item.price}코인에 입양하시겠습니까?`, [
        { text: "취소", style: "cancel" },
        {
            text: "입양하기",
            onPress: async () => {
                try {
                    await api.post(`/mascots/${item.id}/buy`);
                    // 구매 후 바로 장착까지
                    await api.post(`/mascots/${item.id}/equip`); 
                    await fetchData();
                    Alert.alert("축하합니다!", "새로운 가족이 생겼어요!");
                } catch (error: any) {
                    Alert.alert("입양 실패", error.response?.data?.detail || "잔액이 부족합니다.");
                }
            }
        }
    ]);
  };

  // 데이터 불러오기
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. 현재 장착된 캐릭터 ID 찾기
      let equippedId = null;
      try {
        const equippedRes = await api.get('/mascots/equipped');
        equippedId = equippedRes.data?.mascot_id || equippedRes.data?.mascot?.mascot_id;
      } catch (e) {
        console.log("장착된 캐릭터 없음");
      }

      // 2. 전체 목록, 내 목록, 유저 정보 병렬 조회
      const [allRes, myRes, userRes] = await Promise.all([
        api.get('/mascots/'),     
        api.get('/mascots/my'),    
        api.get('/users/me')
      ]);

      const allMascots = allRes.data;
      const myMascotIds = Array.isArray(myRes.data) ? myRes.data.map((m: any) => m.mascot_id) : [];
      
      setMyCash(userRes.data.cash);

      // 3. 데이터 병합 (UI용 포맷으로 변환)
      const formattedList: Character[] = allMascots.map((m: any) => ({
        id: m.mascot_id,
        name: m.name,
        description: m.description,
        price: m.price,
        imageUrl: m.image_url,
        lockedImageUrl: m.locked_image_url, // 🟢 서버에서 받은 잠긴 이미지 매핑
        isOwned: myMascotIds.includes(m.mascot_id),
        isMain: m.mascot_id === equippedId, 
      }));

      setCharacters(formattedList);

    } catch (error) {
      console.error("로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>캐릭터 꾸미기</Text>
        <View style={styles.coinContainer}>
          <Ionicons name="football" size={20} color="#000" />
          <Text style={styles.coinText}>{myCash}</Text>
        </View>
      </View>

      {/* 리스트 영역 */}
      {loading ? (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {characters.length > 0 ? (
            characters.map((item) => (
              <CharacterItem 
                key={item.id} 
                character={item} 
                onEquip={handleEquip} 
                onBuy={handleBuy} // 구매 핸들러 전달
              />
            ))
          ) : (
            <View style={styles.centerContainer}>
                <Text style={{color:'#999'}}>등록된 캐릭터가 없습니다.</Text>
            </View>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerIcon: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  coinContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  coinText: { marginLeft: 4, fontWeight: '600', fontSize: 15 },
  content: { flex: 1 },
  
  // 리스트 아이템 스타일
  characterRow: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems:'center' },
  
  // 이미지 래퍼 (정사각형 유지)
  imageWrapper: { width: 100, height: 100, backgroundColor: '#f9f9f9', borderRadius: 12, marginRight: 16, justifyContent:'center', alignItems:'center' },
  characterImage: { width: '80%', height: '80%' },
  
  infoContainer: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  characterName: { fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 4 },
  mainBadge: { backgroundColor: '#000' },
  ownedBadge: { backgroundColor: '#D187FF' }, // 보라색
  priceBadge: { backgroundColor: '#FFAB5C' }, // 주황색 (NEW 느낌)
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  description: { fontSize: 13, color: '#888', lineHeight: 18, marginBottom: 12 },
  
  buttonRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' },
  buyButton: { backgroundColor: '#333', borderColor:'#333' }, // 구매 버튼은 검정색 강조
  buttonText: { fontSize: 14, color: '#333', fontWeight:'600' },
});