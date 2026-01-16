import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, GoalPeriod, useGoalContext } from '../../../components/GoalContext';

// --- 1. 상수 및 서브 컴포넌트 정의 ---

const TERMS: { value: GoalPeriod; message: string }[] = [
    { value: "일일", message: "매일매일 기특한 나의 습관! 일일 목표!" },
    { value: "주간", message: "주마다 지키고 싶은 나와의 약속! 주간 목표!" },
    { value: "월간", message: "한 달, 한 달, 꾸준히 함께하는 월간 목표!" },
    { value: "연간", message: "뿌듯한 한 해를! 매 해 이루고 싶은 연간 목표!" },
];

const CATEGORIES: { value: Category, label: string }[] = [
    { value: "학업", label: "학업" },
    { value: "취미", label: "취미" },
    { value: "건강", label: "건강" },
    { value: "기타", label: "기타" },
    { value: "없음", label: "없음" },
];

function TermButton({ isTermSelected, onPress }: { isTermSelected: boolean; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={styles.termButtonPress}>
            <View style={[styles.termButton, isTermSelected ? styles.termActive : styles.termInactive]} />
        </Pressable>
    );
}

function CategoryButton({ label, isCategorySelected, onPress }: { label: string; isCategorySelected: boolean; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={[styles.categoryButton, isCategorySelected ? styles.active : styles.inactive]}>
            <Text style={[styles.categoryText, isCategorySelected ? styles.activeText : styles.inactiveText]}>{label}</Text>
        </Pressable>
    );
}

// --- 2. 모달 컴포넌트들 ---

const UpdateConfirmationModal = ({ visible, onCancel, onConfirm }: any) => (
    <Modal transparent={true} animationType='slide' visible={visible}>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>목표 수정</Text>
            <Text style={styles.modalMessage}>변경사항에 따라 수정하시겠습니까?</Text>
            <View style={styles.modalButtonBox}>
                <TouchableOpacity style={styles.modalNormalButton} onPress={onCancel}><Text style={styles.modalButtonText}>취소</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalGreenButton} onPress={onConfirm}><Text style={styles.modalButtonText}>확인</Text></TouchableOpacity>
            </View>
        </View></View>
    </Modal>
);

const CheckingRequiredItemModal = ({ visible, onConfirm }: any) => (
    <Modal transparent={true} animationType='slide' visible={visible}>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>필수항목 확인</Text>
            <Text style={styles.modalMessage}>목표 이름이 기재되었는지 확인해주세요!</Text>
            <TouchableOpacity style={styles.modalNormalButton} onPress={onConfirm}><Text style={styles.modalButtonText}>확인</Text></TouchableOpacity>
        </View></View>
    </Modal>
);

const DeleteConfirmationModal = ({ visible, onCancel, onConfirm }: any) => (
    <Modal transparent={true} animationType='slide' visible={visible}>
        <View style={styles.modalOverlay}><View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>목표 삭제</Text>
            <Text style={styles.modalMessage}>정말 이 목표를 삭제하시겠습니까?</Text>
            <View style={styles.modalButtonBox}>
                <TouchableOpacity style={styles.modalNormalButton} onPress={onCancel}><Text style={styles.modalButtonText}>취소</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalRedButton} onPress={onConfirm}><Text style={styles.modalButtonText}>삭제</Text></TouchableOpacity>
            </View>
        </View></View>
    </Modal>
);

// --- 3. 메인 컴포넌트 ---

export default function EditGoal() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const goalId = Number(id);
    const { goals, updateGoal, deleteGoal } = useGoalContext();

    // Hooks는 반드시 최상단에 위치 (if문보다 위)
    const [nameText, setNameText] = useState('');
    const [termSelected, setTermSelected] = useState<GoalPeriod>('일일');
    const [categorySelected, setCategorySelected] = useState<Category>('없음');
    const [memoText, setMemoText] = useState('');

    const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
    const [isCheckModalVisible, setCheckModalVisible] = useState(false);
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

    const goal = goals.find((g) => g.id === goalId);

    useEffect(() => {
        if (goal) {
            setNameText(goal.title);
            setTermSelected(goal.period);
            setCategorySelected(goal.category);
            setMemoText(goal.memo);
        }
    }, [goal]);

    const selectedTermMessage = useMemo(() => {
        return TERMS.find((o) => o.value === termSelected)?.message ?? '';
    }, [termSelected]);

    // 에러 방지를 위한 Early Return (Hooks 선언 이후에 위치)
    if (!goal) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ padding: 20 }}>존재하지 않는 목표입니다.</Text>
                <TouchableOpacity onPress={() => router.back()}><Text style={{ color: 'blue', paddingLeft: 20 }}>뒤로가기</Text></TouchableOpacity>
            </SafeAreaView>
        );
    }

    const handleConfirmUpdate = () => {
        if (nameText.trim()) {
            updateGoal(goalId, nameText, termSelected, categorySelected, memoText);
            setUpdateModalVisible(false);
            router.back();
        } else {
            setUpdateModalVisible(false);
            setCheckModalVisible(true);
        }
    };

    const handleConfirmDelete = () => {
        deleteGoal(goalId);
        setDeleteModalVisible(false);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>목표 수정하기</Text>
                <MaterialCommunityIcons name="cog" size={26} color="gray" />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 160 }}>
                    
                    {/* 목표 이름 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>목표 이름</Text>
                        <TextInput style={styles.inputTextBox} value={nameText} onChangeText={setNameText} placeholder="빛나는 나의 목표" maxLength={20} />
                    </View>

                    {/* 목표 주기 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>목표 주기</Text>
                        <View style={styles.termTrackLine} />
                        <View style={styles.termButtonBox}>
                            {TERMS.map((trm) => (
                                <TermButton key={trm.value} isTermSelected={termSelected === trm.value} onPress={() => setTermSelected(trm.value)} />
                            ))}
                        </View>
                        <View style={styles.termMessageBox}>
                            <Text style={styles.termText}>{termSelected} 목표</Text>
                            <Text style={styles.termMessageText}>{selectedTermMessage}</Text>
                        </View>
                    </View>

                    {/* 카테고리 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>카테고리</Text>
                        <View style={styles.categoryButtonBox}>
                            {CATEGORIES.map((ctg) => (
                                <CategoryButton key={ctg.value} label={ctg.label} isCategorySelected={categorySelected === ctg.value} onPress={() => setCategorySelected(ctg.value)} />
                            ))}
                        </View>
                    </View>

                    {/* 메모 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>메모</Text>
                        <TextInput style={styles.inputTextBox} multiline value={memoText} onChangeText={setMemoText} placeholder="메모를 입력하세요" maxLength={100} />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* 푸터 버튼 */}
            <View style={styles.footer}>
                <Pressable style={styles.updateButton} onPress={() => setUpdateModalVisible(true)}>
                    <MaterialCommunityIcons name='check-bold' size={40} color='#fff' />
                </Pressable>
                <Pressable style={styles.deleteButton} onPress={() => setDeleteModalVisible(true)}>
                    <MaterialCommunityIcons name='delete-off' size={40} color='#fff' />
                </Pressable>
            </View>

            {/* 모달 */}
            <UpdateConfirmationModal visible={isUpdateModalVisible} onCancel={() => setUpdateModalVisible(false)} onConfirm={handleConfirmUpdate} />
            <DeleteConfirmationModal visible={isDeleteModalVisible} onCancel={() => setDeleteModalVisible(false)} onConfirm={handleConfirmDelete} />
            <CheckingRequiredItemModal visible={isCheckModalVisible} onConfirm={() => setCheckModalVisible(false)} />
        </SafeAreaView>
    );
}

// --- 4. 스타일 정의 ---

const button_size = 80;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f2f6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
    headerIcon: { width: 40, alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
    section: { marginBottom: 15, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
    inputTextBox: { minHeight: 50, backgroundColor: 'whitesmoke', borderRadius: 10, paddingLeft: 15, color: '#000' },
    termTrackLine: { position: 'absolute', left: 40, right: 30, height: 2, width: 260, backgroundColor: 'black', top: '45%' },
    termButtonBox: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    termButtonPress: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    termButton: { height: 15, width: 15, borderRadius: 999 },
    termActive: { backgroundColor: '#9EFFAB', borderWidth: 2, borderColor: 'green' },
    termInactive: { backgroundColor: 'white', borderWidth: 4, borderColor: 'lightgray' },
    termMessageBox: { padding: 5, marginTop: 5 },
    termText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    termMessageText: { fontSize: 14, color: '#666' },
    categoryButtonBox: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    categoryButton: { height: 40, width: '30%', padding: 8, alignItems: 'center', borderWidth: 1, borderRadius: 10, marginBottom: 10, marginHorizontal: 3 },
    active: { backgroundColor: '#77BB6F', borderColor: 'green' },
    inactive: { backgroundColor: 'whitesmoke', borderColor: 'gray' },
    categoryText: { fontSize: 14, fontWeight: 'bold' },
    activeText: { color: 'white' },
    inactiveText: { color: 'gray' },
    footer: { flexDirection: 'row', position: 'absolute', bottom: 0, height: 75, width: '100%', backgroundColor: '#D1EDC3', borderTopLeftRadius: 50, borderTopRightRadius: 50, justifyContent: 'center', alignItems: 'center' },
    updateButton: { top: -20, height: button_size, width: button_size, backgroundColor: '#77BB6F', borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 8, marginHorizontal: 15 },
    deleteButton: { top: -20, height: button_size, width: button_size, backgroundColor: '#BB6F6F', borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 8, marginHorizontal: 15 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    modalMessage: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    modalButtonBox: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
    modalNormalButton: { width: 80, backgroundColor: '#ccc', padding: 10, borderRadius: 5, alignItems: 'center' },
    modalGreenButton: { width: 80, backgroundColor: '#77BB6F', padding: 10, borderRadius: 5, alignItems: 'center' },
    modalRedButton: { width: 80, backgroundColor: '#BB6F6F', padding: 10, borderRadius: 5, alignItems: 'center' },
    modalButtonText: { color: '#fff', fontWeight: 'bold' },
});