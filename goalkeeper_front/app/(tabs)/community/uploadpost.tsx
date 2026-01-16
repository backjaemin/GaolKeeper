import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../src/app'; // [필수] API 연결

//업로드 확인 모달
const UploadConfirmationModal = ({ visible, onCancel, onConfirm }: any) => {
    return (
        <Modal
            transparent={true}
            animationType='slide'
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>게시물 업로드</Text>
                    <Text style={styles.modalMessage}>게시물을 업로드 하시겠습니까?</Text>

                    <View style={styles.modalButtonBox}>
                        <TouchableOpacity style={styles.modalNormalButton} onPress={onCancel}>
                            <Text style={styles.modalButtonText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalGreenButton} onPress={onConfirm}>
                            <Text style={styles.modalButtonText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
// 필수항목 미기재 확인 모달
const CheckingRequiredItemModal = ({ visible, onConfirm }: any) => {
    return (
        <Modal
            transparent={true}
            animationType='slide'
            visible={visible}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>필수항목 확인</Text>
                    <Text style={styles.modalMessage}>제목과 사진을 확인해주세요!</Text>
                    <View style={styles.modalButtonBox}>
                        <TouchableOpacity style={styles.modalNormalButton} onPress={onConfirm}>
                            <Text style={styles.modalButtonText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default function UploadPost() {
    const router = useRouter();
    const handleGoBack = () => {
        router.back();
    };
    
    const initialPostTitle = ''
    const [postTitle, setPostTitle] = useState(initialPostTitle);
    const [content, setContent] = useState(initialPostTitle);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); // 로딩 상태 관리

    //업로드 버튼함수
    const [isUploadModalVisible, setUploadModalVisible] = useState(false);
    const [isCheckModalVisible, setCheckModalVisible] = useState(false);
    
    const handleUploadPost = () => { 
        setUploadModalVisible(true);
    }

    // [핵심 수정] 서버로 데이터 전송하는 함수
    const handleConfirmUpload = async () => { 
        // 제목과 이미지가 있는지 확인
        if (postTitle && imageUri) { 
            try {
                // 1. 로딩 시작 및 모달 닫기
                setUploadModalVisible(false);
                setLoading(true);

                // 2. 서버로 보낼 데이터 상자(FormData) 만들기
                const formData = new FormData();
                formData.append('title', postTitle);   // 제목
                formData.append('content', content); // 내용 (입력칸이 없으므로 제목과 동일하게 설정)

                // 3. 이미지 데이터 가공
                const filename = imageUri.split('/').pop() || 'upload.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;



                // @ts-ignore: 리액트 네이티브 FormData 타입 이슈 무시
                formData.append('image', {
                    uri: imageUri,
                    name: filename,
                    type: type,
                });

                // 4. API 전송 (POST 요청)
                // [주의] 백엔드 라우터 주소가 /community/ 인지 /board/ 인지 확인 필요 (여기선 community로 설정)
                await api.post('/community/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                // 5. 성공 처리
                Alert.alert("성공", "게시글이 등록되었습니다.");
                setPostTitle(initialPostTitle);
                setImageUri(null);
                router.back();

            } catch (error) {
                console.error("업로드 에러:", error);
                Alert.alert("오류", "게시글 업로드에 실패했습니다.\n서버 상태를 확인해주세요.");
            } finally {
                setLoading(false); // 로딩 끝
            }
        }
        else {
            // 필수 항목 누락 시
            setCheckModalVisible(true); 
            setUploadModalVisible(false);
        }
    };

    const handleConfirmChecking = () => { 
        setCheckModalVisible(false);
    };
    const handleCancelUpload = () => { 
        setUploadModalVisible(false);
    };

    //이미지 권한 
    const [mediaStatus, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();
    const ensureMediaLibraryPermission = useCallback(async () => {
        if (mediaStatus?.granted) return true;

        const res = await requestMediaPermission();
        if (res.granted) return true;

        // 거절된 경우: 설정 유도
        Alert.alert(
            '권한이 필요합니다',
            '사진을 업로드하려면 사진 접근 권한이 필요합니다. 설정에서 허용해 주세요.',
            [
                { text: '취소', style: 'cancel' },
                { text: '설정 열기', onPress: () => Linking.openSettings() },
            ]
        );
        return false;
    }, [mediaStatus?.granted, requestMediaPermission]);

    const pickImage = useCallback(async () => {
        const ok = await ensureMediaLibraryPermission();
        if (!ok) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 1,
            // aspect: [4, 3], 
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    }, [ensureMediaLibraryPermission]);

    const removeImage = useCallback(() => {
        setImageUri(null);
    }, []);

    // [로딩 화면 처리] 업로드 중일 때 화면
    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={{ marginTop: 10, color: '#555' }}>업로드 중입니다...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* 헤더 영역 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.headerIcon}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>게시물 추가하기</Text>

                <View style={styles.headerIcon}>
                    <Ionicons name="pencil" size={26} color="#000" />
                </View>
            </View>

            {/* 메인영역 */}
            <View style={styles.content}>
                <View>
                    <TextInput
                        style={styles.inputTextBox}
                        placeholder="제목을 입력해주세요"
                        placeholderTextColor="dimgray"
                        maxLength={20}
                        value={postTitle}
                        onChangeText={setPostTitle}
                    />
                </View>

                <View>
                    <TextInput
                        style={[styles.inputTextBox, styles.contentInput]}
                        placeholder="내용을 입력해주세요"
                        placeholderTextColor="dimgray"
                        maxLength={50}
                        value={content}
                        onChangeText={setContent}
                        multiline={true} // 여러 줄 입력 가능하게 설정
                        textAlignVertical="top" //  안드로이드에서 텍스트가 상단부터 시작하도록 설정
                    />
                </View>

                <View style={styles.pickImageBox}>
                    <Pressable style={styles.pickImage} onPress={pickImage}>
                        {imageUri ? (
                            <>
                                {/* 선택 이미지 미리보기 */}
                                <Image source={{ uri: imageUri }} style={styles.previewImage} />

                                {/* 우측 상단 제거 버튼 */}
                                <Pressable onPress={removeImage} style={styles.removeBadge} hitSlop={10}>
                                    <Ionicons name="close" size={18} color="#000" />
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons name = 'image' size={100} color={'black'} />
                                <Text style={styles.pickHint}>사진 업로드</Text>
                            </>
                        )}
                    </Pressable>
                    <View style={styles.buttonBox}>
                        <Pressable style={styles.button}>
                            <Text style={styles.buttonText} onPress={handleUploadPost}>완료</Text>
                        </Pressable>
                        <Pressable style={styles.button} onPress={handleGoBack}>
                            <Text style={styles.buttonText}>취소</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
            {/*확인 모달*/}
            <CheckingRequiredItemModal
                visible = {isCheckModalVisible}
                onConfirm = {handleConfirmChecking}
            />
            <UploadConfirmationModal
                visible = {isUploadModalVisible}
                onCancel = {handleCancelUpload}
                onConfirm = {handleConfirmUpload}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f2f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    headerIcon: {
        width: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20, // 부모가 20의 여백을 가짐
        paddingTop: 16,
    },
    inputTextBox: {
        width: '100%', // 입력창 너비 100%
        minHeight: 50,
        backgroundColor: 'white',
        color: 'black',
        borderWidth: 2,
        borderColor: 'black',
        borderRadius: 50,
        marginBottom: 10,
        paddingLeft: 20,
        // ... 그림자 효과 ...
    },
    contentInput: {
        minHeight: 100,
        borderRadius: 35,
        marginTop: 10,
    },
    pickImageBox: {
        width: '100%', // 박스 영역 전체 사용
        alignItems: 'center',
        paddingTop: 16,
        // paddingHorizontal: 20;  <-- 이 줄을 삭제했습니다 (중복 패딩 방지)
    },
    pickImage: {
        width: '100%', // 90%에서 100%로 수정하여 입력창과 길이를 맞춤
        height: 250,   // 높이는 적절히 조절 (200 -> 250 추천)
        borderWidth: 2, // 두께를 입력창(2)과 맞추면 더 깔끔합니다
        borderColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderRadius: 20, // 사진 박스도 약간 둥글게 하면 더 조화롭습니다
    },
    pickHint: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buttonBox: {
        width: '100%',       
        flexDirection: 'row',    
        justifyContent: 'flex-end',
        marginTop: 20,            
        paddingBottom: 20,        
    },
    button: {
        width: '22%',        
        height: 50,     
        backgroundColor: 'white',
        borderWidth: 2,    
        borderColor: 'black',
        borderRadius: 25,   
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    buttonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer:{
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center'
    },
    modalTitle:{
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalMessage:{
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtonBox:{
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalNormalButton:{
        width: 70,
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center'
    },
    modalRedButton:{
        width: 70,
        backgroundColor: '#BB6F6F',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center'
    },
    modalGreenButton:{
        width: 70,
        backgroundColor: '#77BB6F',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center'
    },
    modalButtonText:{
        color: '#fff',
        fontWeight: 'bold',
    },
});