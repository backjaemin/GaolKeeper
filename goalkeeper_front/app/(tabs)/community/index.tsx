import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../src/app'; 

// 1. 통합 데이터 타입 정의
interface BoardPost {
  post_id: number;
  user_id: number;
  title: string;
  content: string;
  image_url: string | null;
  nickname: string;
  created_at: string;
  reaction_counts: Record<string, number>; 
  my_reaction: string | null;            
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
type AnchorRect = { x: number; y: number; w: number; h: number };

// 팝오버 위치 계산 함수
function getPopoverStyle(anchor: AnchorRect | null) {
  if (!anchor) return { top: 0, left: 0, opacity: 0 };
  const { width: SW } = Dimensions.get('window');
  const POPOVER_W = 260;
  const POPOVER_H = 56;
  const GAP = 8;

  let left = anchor.x + anchor.w / 2 - POPOVER_W / 2;
  left = Math.max(12, Math.min(left, SW - POPOVER_W - 12));
  const top = anchor.y - POPOVER_H - GAP;

  return { top, left, width: POPOVER_W };
}

// 2. 개별 게시글 카드 컴포넌트 (상세 이동 + 리액션 포함)
function PostCard({ item, onRefresh }: { item: BoardPost; onRefresh: () => void }) {
  const router = useRouter();
  const btnRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  // 이미지 서버 URL 조합
  const serverBaseUrl = api.defaults.baseURL?.split('/api')[0];
  const fullImageUrl = item.image_url ? `${serverBaseUrl}${item.image_url}` : null;

  const openPopover = () => {
    btnRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setOpen(true);
    });
  };

  const closePopover = () => setOpen(false);

  // 이모지 반응 API 호출
  const onPick = async (emoji: string) => {
    try {
      await api.post(`/community/${item.post_id}/react`, { emoji });
      onRefresh(); 
      closePopover();
    } catch (error) {
      console.error('리액션 저장 에러:', error);
      Alert.alert('알림', '반응을 저장하지 못했습니다.');
    }
  };

  return (
    <View style={styles.card}>
      {/* --- 클릭 시 상세 페이지로 이동하는 영역 --- */}
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: '/community/[id]',
          params: { id: item.post_id }
        })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle-outline" size={34} color="#555" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.writer}>{item.nickname}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {fullImageUrl && (
          <Image source={{ uri: fullImageUrl }} style={styles.postImage} resizeMode="cover" />
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
        </View>
      </TouchableOpacity>
      {/* -------------------------------------- */}

      {/* 반응 버튼 영역 (독립된 클릭 영역) */}
      <View style={styles.interactionRow}>
        <View style={styles.badgeContainer}>
          {Object.entries(item.reaction_counts || {}).map(([emoji, count]) => (
            <TouchableOpacity 
              key={emoji} 
              style={[
                styles.interactionBadge,
                item.my_reaction === emoji && styles.myReactionBadge 
              ]}
              onPress={() => onPick(emoji)}
            >
              <Text style={styles.interactionText}>{emoji} {count}</Text>
            </TouchableOpacity>
          ))}

          <Pressable style={styles.interactionBadge} onPress={openPopover}>
            <View ref={btnRef} collapsable={false} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="emoticon-plus-outline" size={18} color="#666" />
            </View>
          </Pressable>
        </View>
      </View>

      {/* 이모지 선택 모달 */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={closePopover}>
        <Pressable style={styles.backdrop} onPress={closePopover}>
          <Pressable style={[styles.popover, getPopoverStyle(anchor)]}>
            <View style={styles.emojisRow}>
              {EMOJIS.map((e) => (
                <Pressable key={e} style={styles.emojiBtn} onPress={() => onPick(e)}>
                  <Text style={styles.emoji}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// 3. 메인 화면 컴포넌트
export default function CommunityScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/community/');
      setPosts(response.data);
    } catch (error: any) {
      console.error('게시글 로딩 에러:', error);
      if (error.message === 'Network Error') {
        Alert.alert('연결 실패', '서버와 연결할 수 없습니다.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#333" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.post_id.toString()}
          renderItem={({ item }) => <PostCard item={item} onRefresh={fetchPosts} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>게시글이 없습니다. 첫 글을 작성해보세요!</Text>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('../community/uploadpost')}
      >
        <Ionicons name="pencil" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  listContent: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: { padding: 12, flexDirection: 'row', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  writer: { fontSize: 14, fontWeight: '600', color: '#333' },
  date: { fontSize: 12, color: '#888' },
  postImage: { width: '100%', height: 200, backgroundColor: '#eee' },
  contentContainer: { padding: 16 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#000' },
  content: { fontSize: 14, color: '#555', lineHeight: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  interactionRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  interactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  myReactionBadge: {
    backgroundColor: '#E7F5FF', 
    borderColor: '#A5D8FF',
  },
  interactionText: { fontSize: 13, fontWeight: '600', color: '#495057' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  popover: {
    position: 'absolute',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  emojisRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emojiBtn: { padding: 5 },
  emoji: { fontSize: 24 },
});