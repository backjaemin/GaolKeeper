import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../src/app';

export default function EditPost() {
    const router = useRouter();
    // 상세 페이지에서 넘겨준 기존 데이터 받기
    const { id, title, content } = useLocalSearchParams<{ id: string, title: string, content: string }>();

    const [postTitle, setPostTitle] = useState(title);
    const [postContent, setPostContent] = useState(content);
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!postTitle.trim() || !postContent.trim()) {
            Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('title', postTitle);
            formData.append('content', postContent);
            // 사진 수정은 복잡해지니 일단 제목/내용 수정만 구현합니다.

            // 수정 요청 (PATCH)
            await api.patch(`/community/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert("성공", "수정되었습니다.");
            router.dismiss(2); // 수정페이지 -> 상세페이지 -> 목록 (2단계 뒤로가서 갱신 유도)
            router.replace('/(tabs)/community'); // 목록 새로고침을 위해 아예 이동
            
        } catch (error) {
            console.error(error);
            Alert.alert("실패", "게시글 수정 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ fontSize: 16 }}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>게시글 수정</Text>
                <TouchableOpacity onPress={handleUpdate}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'blue' }}>완료</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <TextInput
                        style={styles.inputTitle}
                        value={postTitle}
                        onChangeText={setPostTitle}
                        placeholder="제목"
                    />
                    <TextInput
                        style={styles.inputContent}
                        value={postContent}
                        onChangeText={setPostContent}
                        placeholder="내용"
                        multiline
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    inputTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10 },
    inputContent: { fontSize: 16, lineHeight: 24, minHeight: 200, textAlignVertical: 'top' },
});