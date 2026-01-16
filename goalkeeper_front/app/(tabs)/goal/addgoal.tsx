import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
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
import { useGoalContext } from '../../../components/GoalContext';

// 개별 목표 주기 버튼
type Term = '일일'|'주간'|'월간'|'연간';
const TERMS: {value: Term; message: string}[] = [
    {value: "일일", message: "매일매일 기특한 나의 습관! 일일 목표!"},
    {value: "주간", message: "주마다 지키고 싶은 나와의 약속! 주간 목표!"},
    {value: "월간", message: "한 달, 한 달, 꾸준히 함께하는 월간 목표!"},
    {value: "연간", message: "뿌듯한 한 해를! 매 해 이루고 싶은 연간 목표!"},
];
function TermButton({
    isTermSelected,
    onPress,
}:{
    isTermSelected: boolean;
    onPress: () => void;
}){
    return(
        <Pressable onPress={onPress} style={styles.termButtonPress}>
            <View style={[styles.termButton, isTermSelected ? styles.termActive : styles.termInactive]}/>
        </Pressable>
    );
}

// 개별 카테고리 버튼
type Category = '학업'|'취미'|'건강'|'기타'|'없음';
const CATEGORIES: {value: Category, label: string}[]=[
    { value: "학업", label:"학업"},
    { value: "취미", label:"취미"},
    { value: "건강", label:"건강"},
    { value: "기타", label:"기타"},
    { value: "없음", label:"없음"},
];
function CategoryButton({
    label,
    isCategorySelected,
    onPress,
}:{
    label: string;
    isCategorySelected: boolean;
    onPress: () => void;
}){
    return(
        <Pressable
            onPress={onPress}
            style={[styles.categoryButton, isCategorySelected ? styles.active : styles.inactive]}
        >
            <Text style={[styles.categoryText, isCategorySelected ? styles.activeText : styles.inactiveText]}>
                {label}
            </Text>
        </Pressable>
    );
}
//추가 확인 모달
const UpdateConfirmationModal = ({ visible, onCancel, onConfirm }: any) => {
    return (
        <Modal
            transparent={true}
            animationType='slide'
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>목표 추가</Text>
                    <Text style={styles.modalMessage}>작성한 목표를 추가하시겠습니까?</Text>

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


//필수항목 미기재 확인 모달
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
                    <Text style={styles.modalMessage}>목표 이름이 기재되었는지 확인해주세요!</Text>
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


export default function AddGoal(){
    const handleGoBack = () => {
        router.back();
    };
    //목표 이름
    const initialNameText = '';
    const[nameText,setNameText] = useState(initialNameText); 
    //목표 주기
    const initialTermSelected = '일일';
    const[termSelected, setTermSelected] = useState<Term>(initialTermSelected); 
    const selectedTermMessage = useMemo(()=>{
        return TERMS.find((o)=>o.value === termSelected)?.message ??'';
    }, [termSelected]);
    //목표 카테고리
    const initialCategorySelected = '없음';
    const[categorySelected, setCategorySelected] = useState<Category>(initialCategorySelected); 
    const handleCategory = (value: Category)=>{
        setCategorySelected(value);
    }
    
    //목표 메모
    const initialMemoText = ''
    const[memoText,setMemoText] = useState(initialMemoText);

    //추가 확인 모달 //필수항목 미기재 확인 모달
    const { addGoal } = useGoalContext();
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isCheckModalVisible, setCheckModalVisible] = useState(false);
    
    const handleAddGoal = () => { //추가 확인 모달 호출
        setAddModalVisible(true);
    };
    const handleConfirmAdd = () => { //추가 확인
        if (nameText && termSelected && categorySelected){
            addGoal(nameText, termSelected, categorySelected, memoText);
            setNameText(initialNameText);
            setTermSelected(initialTermSelected);
            setCategorySelected(initialCategorySelected);
            setMemoText(initialMemoText);
            router.back();
        }
        else{
            setCheckModalVisible(true); //체크 모달
            setAddModalVisible(false);
        }
    };
    const handleConfirmChecking = () =>{
        setCheckModalVisible(false); //체크 모달 숨김
    };
    const handleCancelAdd = () =>{
        setAddModalVisible(false); //추가 취소
    }
    

    
    
    return(
        <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
            {/* 1. 헤더 영역 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleGoBack} style={styles.headerIcon}>
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>목표 추가하기</Text>
               <MaterialCommunityIcons name="bullseye-arrow" size={26} color="#000" />
            </View>
            <KeyboardAvoidingView
                style={{flex:1}}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
                <ScrollView 
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 160}}
                    keyboardShouldPersistTaps='handled' 
                    showsVerticalScrollIndicator={false}
                >
                    
                    {/* 2. 목표 이름 섹션 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>목표 이름</Text>
                        </View>
                        <View>
                            <TextInput
                                style = {styles.inputTextBox}
                                placeholder = "빛나는 나의 목표"
                                placeholderTextColor="gray"
                                maxLength={20}  //최대 글자 수 20자
                                value = {nameText}
                                onChangeText = {setNameText}
                            />
                        </View>    
                    </View>
                    
                    {/* 3. 목표 주기 섹션 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>목표 주기</Text>
                        </View>
                        <View style={styles.termTrackLine}/>
                        <View style={styles.termButtonBox}>
                            {TERMS.map((trm)=>(
                                <TermButton
                                    key={trm.value}
                                    isTermSelected={termSelected===trm.value}
                                    onPress={()=>setTermSelected(trm.value)}
                                />
                            ))}
                        </View>
                        <View style={styles.termMessageBox}>
                            <Text style={styles.termText}>{termSelected} 목표</Text>
                            <Text style={styles.termMessageText}>{selectedTermMessage}</Text>
                        </View>
                    </View>

                    {/* 4. 카테고리 섹션 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>카테고리</Text>
                        </View>
                        <View style={styles.categoryButtonBox}>
                            {CATEGORIES.map((ctg)=>(
                                <CategoryButton
                                    key={ctg.value}
                                    label={ctg.label}
                                    isCategorySelected={categorySelected === ctg.value}
                                    onPress={()=>handleCategory(ctg.value)}
                                />
                            ))}
                        </View>
                        {/* 기타 선택 시 입력창
                        {categorySelected === "기타"&&(
                            <View style={styles.customWrap}>
                                <TextInput
                                    style={styles.inputTextBox}
                                    value={customCategory}
                                    onChangeText={(v)=>{
                                        setCustomCategory(v);
                                    }}
                                    placeholder='원하시는 카테고리를 입력하세요'
                                    placeholderTextColor="gray"
                                    maxLength={10}
                                />
                            </View>
                        )} */}
                    </View>

                    {/* 5. 메모 섹션 */}
                    <View style={styles.section} >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>메모</Text>
                        </View>
                        <TextInput
                                style = {styles.inputTextBox}
                                multiline
                                placeholder = "나의 멋진 목표에 대한 설명이나 메모를 작성해보세요!"
                                maxLength={100}  //최대 글자 수 100자
                                placeholderTextColor="gray"
                                value = {memoText}
                                onChangeText = {setMemoText}
                            />
                    </View>
                    {/* 하단 여백 확보*/}
                    <View style={{marginBottom : 20}}/>

                </ScrollView>
            </KeyboardAvoidingView>
            {/* 5. 푸터 영역 (목표 추가하기) */}
            <View style={styles.footer}>
                <Pressable style={styles.addButton} onPress={handleAddGoal}>
                    <MaterialCommunityIcons name='plus-thick' size={button_size/2} color='#fff'/>
                </Pressable>
            </View>
            <CheckingRequiredItemModal
                visible = {isCheckModalVisible}
                onConfirm = {handleConfirmChecking}
            />
            <UpdateConfirmationModal
                visible = {isAddModalVisible}
                onCancel = {handleCancelAdd}
                onConfirm = {handleConfirmAdd}
            /> 
        </SafeAreaView>
        
    );

}


//스타일
const button_size = 80;//추가버튼 크기
const categoryNumber = CATEGORIES.length; //카테고리 버튼 크기
const ctg_size = (((categoryNumber + 4) % 5 + 1) + (categoryNumber/5)) > 5 ? '18%' : '21%' ;


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
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    section: {
        marginBottom: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        // 그림자 효과 (iOS/Android 통일)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 5,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    inputTextBox:{
        minHeight: 50,
        backgroundColor: 'whitesmoke',
        color:'black',
        borderRadius: 10,
        marginBottom: 10,
        paddingLeft: 15,
    },
    termTrackLine:{
        position: 'absolute',
        left: 40,
        right: 30,
        height: 2,
        width: 260,
        backgroundColor: 'black',
        top: '50%',
    },
    termButtonBox:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 1,
    },
    termButtonPress: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    termButton:{
        height: 15,
        width: 15,
        borderRadius:999
    },
    termActive:{
        backgroundColor:'#9EFFAB',
        borderWidth: 2,
        borderColor:'green',
    },
    termInactive:{
        backgroundColor:'white',
        borderWidth: 4,
        borderColor:'lightgray',
    },
    termMessageBox:{
        padding: 5,
        marginTop: 5,
        marginBottom: 5,
    },
    termText:{
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 3,
        marginBottom: 8,
    },
    termMessageText:{
        fontSize: 14,
    },
    categoryButtonBox:{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    categoryButton: {
        height: 40,
        width: ctg_size,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
        marginHorizontal: 3,
    },
    active: {
        backgroundColor: '#77BB6F',
        borderColor: 'green'
    },
    inactive: {
        backgroundColor: 'whitesmoke',
        borderColor: 'gray'
    },
    categoryText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    activeText: {
        color: 'white'
    },
    inactiveText: {
        color: 'gray'
    },
    customWrap:{
        marginTop: 10
    },
    footer: { 
        position: 'absolute',
        bottom: 0,
        height: 75,
        width: '100%',
        paddingHorizontal: 16,
        paddingTop: 12,
        alignItems: 'center',
        backgroundColor: '#D1EDC3',
        borderTopLeftRadius: 999,
        borderTopRightRadius: 999
    },
    addButton: {
        position: 'absolute',
        top: -button_size / 2,
        height: button_size,
        width: button_size,
        backgroundColor: '#77BB6F',
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
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