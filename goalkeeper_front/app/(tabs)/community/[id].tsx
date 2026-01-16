import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../src/app';
import { tokenManager } from '../../../src/utils/tokenManager';
import { jwtDecode } from 'jwt-decode'; // npm install jwt-decode 필요!

export default function PostDetail() {
    const { id } = useLocalSearchParams(); // URL에서 글 번호 가져오기
    const router = useRouter();
    
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [myId, setMyId] = useState<number | null>(null);

    // 1. 내 ID 알아내기 (수정/삭제 버튼 표시용)
    useEffect(() => {
        const checkMyId = async () => {
            const token = await tokenManager.getToken();
            if (token) {
                try {
                    const decoded: any = jwtDecode(token);
                    setMyId(Number(decoded.sub)); // 토큰 안에 있는 내 ID (숫자)
                } catch (e) {
                    console.log("토큰 에러", e);
                }
            }
        };
        checkMyId();
        fetchPostDetail();
    }, [id]);

    // 2. 게시글 상세 정보 가져오기
    const fetchPostDetail = async () => {
        try {
            const response = await api.get(`/community/${id}`);
            setPost(response.data);
        } catch (error) {
            Alert.alert("오류", "글을 불러오지 못했습니다.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // 3. 삭제 함수
    const handleDelete = () => {
        Alert.alert("삭제", "정말 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            { 
                text: "삭제", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        await api.delete(`/community/${id}`);
                        Alert.alert("성공", "삭제되었습니다.");
                        router.back(); // 목록으로 돌아가기
                    } catch (e) {
                        Alert.alert("실패", "삭제 권한이 없거나 오류가 발생했습니다.");
                    }
                }
            }
        ]);
    };

    // 4. 수정 페이지로 이동
    const handleEdit = () => {
        // 수정 페이지로 현재 제목과 내용을 들고 이동
        router.push({
            pathname: '../community/editpost',
            params: { 
                id: post.post_id, 
                title: post.title, 
                content: post.content, 
                image: post.image_url 
            }
        });
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    const serverBaseUrl = api.defaults.baseURL?.split('/api')[0];
    const fullImageUrl = post?.image_url ? `${serverBaseUrl}${post.image_url}` : null;

    return (
        <SafeAreaView style={styles.container}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={28} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>게시글 상세</Text>
                
                {/* 내가 쓴 글일 때만 수정/삭제 버튼 표시 */}
                {myId === post?.user_id ? (
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <TouchableOpacity onPress={handleEdit}>
                            <Ionicons name="create-outline" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ width: 24 }} /> // 공간 채우기용
                )}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.userInfo}>
                    <Ionicons name="person-circle" size={40} color="#ccc" />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.nickname}>{post?.nickname}</Text>
                        <Text style={styles.date}>{new Date(post?.created_at).toLocaleString()}</Text>
                    </View>
                </View>

                <Text style={styles.title}>{post?.title}</Text>
                
                {fullImageUrl && (
                    <Image source={{ uri: fullImageUrl }} style={styles.image} resizeMode="contain" />
                )}

                <Text style={styles.body}>{post?.content}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee', alignItems:'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    nickname: { fontWeight: 'bold', fontSize: 16 },
    date: { color: '#888', fontSize: 12 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    body: { fontSize: 16, lineHeight: 24, color: '#333' },
    image: { width: '100%', height: 300, marginBottom: 20, borderRadius: 10, backgroundColor:'#f0f0f0' }
});