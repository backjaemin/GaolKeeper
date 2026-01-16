import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoalContext } from '../../../components/GoalContext';
import GoalListWithFakeScrollbar from '../../../components/GoalListWithFakeScrollbar';
// [이미지 경로 관련 수정]
// 로컬 이미지가 있다면 아래 주석을 풀고 require 경로를 맞춰주세요.
// 현재는 실행 보장을 위해 Ionicons 아이콘으로 대체했습니다.
// const INCOMPLETE_IMAGE = require('@/assets/images/pawFalse.png'); 
// const COMPLETE_IMAGE = require('@/assets/images/pawTrue.png');      

// 데이터 타입 정의
interface Goal {
  id: number;
  title: string;
  period: string,
  category: string,
  memo: string;
  is_completed: boolean;
}


// 개별 목표 아이템 컴포넌트
const GoalItem = ({ goal }: { goal: Goal }) => {
  const router = useRouter();
  const { toggleGoalCompletion } = useGoalContext();

  const handleEdit = () =>{
      router.push({
        pathname: '/(tabs)/goal/editgoal',
        params: { id: String(goal.id)}
      });
  };
  const handleToggle = () => {
      toggleGoalCompletion(goal.id); 
  };

  const imageSource = goal.is_completed
  ? require("../../../assets/images/ON.png") 
  : require("../../../assets/images/OFF.png");
    
  return (
    <View style={styles.goalRow}>
      <Pressable
        style = {styles.goalTextBox}
        onPress = {() => handleEdit()}
       >
        <Text style={[styles.goalText, goal.is_completed && styles.completedText]}>
            {goal.title}
        </Text>
      </Pressable>
      
      <View style={styles.goalRight}>
        <TouchableOpacity 
          style={styles.imageToggleButton}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
        <Image
            source={imageSource}
            style={styles.buttonImage}
        />
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default function GoalScreen() {
    const router = useRouter();
    const { goals, addGoal, toggleGoalCompletion, deleteGoal } = useGoalContext();
    
    const handleAddGoal = () => {
        router.push("/(tabs)/goal/addgoal");
    };
    
    const handleSearch = () => {
        console.log("검색 버튼 클릭");
    };
    
    const handleGoBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 1. 헤더 영역 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleGoBack} style={styles.headerIcon}>
                <Ionicons name="chevron-back" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>나의 목표</Text>
              <TouchableOpacity onPress={handleSearch} style={styles.headerIcon}>
                <Ionicons name="search-outline" size={26} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.content}>

                {/* 2. 목표영역 */}    
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* 2.1. 일일 목표 섹션 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Image 
                                source={require("../../../assets/images/hippo-hi.png")}
                                style={styles.sectionImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.sectionTitle}>일일 목표</Text>
                        </View>
                        <GoalListWithFakeScrollbar
                            items={goals.filter(goal => goal.period === '일일')}
                            height={200}
                            renderItem={(goal,index)=>(
                                <View key={goal.id} style={styles.goalContainer}>
                                    <GoalItem goal={goal} />
                                </View>
                            )}
                        />
                    </View>

                    {/* 2.2 주간 목표 섹션 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Image 
                                source={require("../../../assets/images/hippo-tube.png")}
                                style={styles.sectionImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.sectionTitle}>주간 목표</Text>
                        </View>
                        <GoalListWithFakeScrollbar
                            items={goals.filter(goal => goal.period === '주간')}
                            height={200}
                            renderItem={(goal,index)=>(
                                <View key={goal.id} style={styles.goalContainer}>
                                    <GoalItem goal={goal} />
                                </View>
                            )}
                        />
                    </View>
                    {/* 2.1. 월간 목표 섹션 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Image 
                                source={require("../../../assets/images/hippo-hi.png")}
                                style={styles.sectionImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.sectionTitle}>월간 목표</Text>
                        </View>
                        <GoalListWithFakeScrollbar
                            items={goals.filter(goal => goal.period === '월간')}
                            height={200}
                            renderItem={(goal,index)=>(
                                <View key={goal.id} style={styles.goalContainer}>
                                    <GoalItem goal={goal} />
                                </View>
                            )}
                        />
                    </View>
                    {/* 2.1. 연간 목표 섹션 */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Image 
                                source={require("../../../assets/images/hippo-hi.png")}
                                style={styles.sectionImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.sectionTitle}>연간 목표</Text>
                        </View>
                        <GoalListWithFakeScrollbar
                            items={goals.filter(goal => goal.period === '연간')}
                            height={200}
                            renderItem={(goal,index)=>(
                                <View key={goal.id} style={styles.goalContainer}>
                                    <GoalItem goal={goal} />
                                </View>
                            )}
                        />
                    </View>


                    {/* 하단 여백 확보 */}
                    <View style={{ height: 40 }} />

                </ScrollView>
            </View>
            {/* 3. 목표 추가 버튼 */}
            <View style={styles.addFooter}>
                <Pressable style={styles.addButton} onPress={handleAddGoal}>
                    <MaterialCommunityIcons name="plus" size={30} color="#3CB371" />
                    <Text style={styles.addButtonText}>목표 추가하기</Text>
                </Pressable>
            </View>
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
        marginHorizontal: 20,
        marginTop: 10,
        paddingHorizontal: 15,
        paddingTop: 6,
        borderRadius: 12,
        backgroundColor: '#fff',
        // 그림자 효과 (iOS/Android 통일)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    section: {
        marginBottom: 5,
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionImage: {
        width: 50,
        marginRight: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    goalContainer: {
        position: 'relative',
    },
    goalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderColor: '#E5E3E3',
        borderWidth: 1,
        borderRadius: 15,
        backgroundColor: '#F7F7F7',
        marginBottom: 4,
    },
    goalTextBox: {
        flex: 1,
        marginVertical: 10,
        marginRight: 40,
        justifyContent: 'center',

        marginLeft: 20,
    },
    goalText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    completedText: {
        color: '#aaa',

    },
    goalRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageToggleButton: { 
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 0,
    },
    buttonImage:{
        width: 60,
        height: 60,
        resizeMode: "contain"
    },
    progressStick: {
        width: 2,
        flex: 1,
        backgroundColor: '#E6E6FA', // 연한 보라색
    },
    addFooter:{
        position: 'absolute',
        bottom: 20,
        width: '89.6%',
        marginHorizontal : '5.2%',
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomRightRadius: 15,
        borderBottomLeftRadius: 15,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        width: '90%',
        marginTop: 20,
        marginBottom: 25,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#99e2c4',
    },
    addButtonText: {
        fontSize: 18,
        color: 'bkack',
        fontWeight: 'bold',
        marginLeft: 8,
    },
});