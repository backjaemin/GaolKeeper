import { ImageBackground } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Alert,
    Image,
    LayoutChangeEvent,
    PanResponder,
    Pressable,
    StatusBar,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoalContext } from '../../components/GoalContext';
import GoalListWithFakeScrollbar from '../../components/GoalListWithFakeScrollbar';
import EquippedCharacter from '../../components/EquippedCharacter'; // 캐릭터 컴포넌트
import { getImageUrl } from '../../components/CharacterPreview';
import { useEquippedItems } from '../../hooks/useEquippedItems';

import api from '../../src/app';
import { Ionicons } from '@expo/vector-icons';
// [이미지 경로 관련 수정]
// 로컬 이미지가 있다면 아래 주석을 풀고 require 경로를 맞춰주세요.
// 현재는 실행 보장을 위해 Ionicons 아이콘으로 대체했습니다.
// const INCOMPLETE_IMAGE = require('@/assets/images/pawFalse.png'); 
// const COMPLETE_IMAGE = require('@/assets/images/pawTrue.png');   

//연속 표시 
const SuccessionDots = ({ streak }: { streak: number }) => {
    const successionValue = streak;
    const max = 7;
    const size = 22;
    const gap = 4;
    const n = (successionValue-1) % 7 +1;
    return (
        <View style={styles.successionBox}>
            <Text style={styles.successionText}>{successionValue}일 연속 일일목표 달성 중!</Text>
            <View style={styles.horizontalLine} />
            <View style={styles.successionDotBox}>
                {Array.from({ length: max }).map((_, index) => (
                    <View
                        key={index}
                    >
                        {index < n ? (
                            <Image source={require('../../assets/images/mainpage/succession/soccerball.png')}
                                style={[{ width: size, height: size, marginRight: gap }]}
                            />
                        ) : (
                            <View
                                style={[
                                    {
                                        width: size,
                                        height: size,
                                        marginRight: gap,
                                        backgroundColor: '#D9D9D9',
                                        borderColor: 'gray',
                                        borderRadius: size,
                                        borderWidth: 2,
                                    },
                                ]}
                            />
                        )}
                    </View>
                ))}
            </View>

        </View>
    );
};


// 캐릭터 영역 컴포넌트
const characterImageSize = 90;
const levelImageSize = 25;

const FrameScreen = ({ level }: { level: number }) => {
    const router = useRouter();
    const { data, loading } = useEquippedItems();
    const frameBackgroundImage = getImageUrl(data?.background?.image_url);

    const characterDefaultImage = require('../../assets/images/mainpage/characters/hippo-1.png');
    const characterDragedImage = require('../../assets/images/mainpage/characters/hippo-1.png');

    

    // 레벨별 데이터 정의
    const LEVEL_DATA: Record<number, { label: string; image: any }> = {
        1: { label: '씨앗', image: require('../../assets/images/lv1.png') },
        2: { label: '새싹', image: require('../../assets/images/lv2.png') },
        3: { label: '꽃봉오리', image: require('../../assets/images/lv3.png') },
        4: { label: '꽃', image: require('../../assets/images/lv4.png') },
    };

    // 4레벨 이상을 처리
    const getLevelInfo = (level: number) => {
        if (level >= 4) return LEVEL_DATA[4];
        return LEVEL_DATA[level] || LEVEL_DATA[1]; // 기본값은 1레벨(씨앗)
    };

    // 🌟 현재 레벨에 맞는 정보 가져오기
    const currentLevelInfo = getLevelInfo(level);

    const handleGoCharacter = () => {
        router.push('/(tabs)/character');
    };
    const [draged, setDraged] = useState(false);
    const characterRecentImage = draged ? characterDragedImage : characterDefaultImage;
    const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
    const IMG_SIZE = characterImageSize;
    const initial_x = 160 - (IMG_SIZE / 2);
    const initial_y = 150 - (IMG_SIZE / 2);
    // 현재 위치(애니메이션 값)
    const pos = useRef(new Animated.ValueXY({ x: initial_x, y: initial_y })).current;
    // "원래 자리" 저장용
    const homePos = useRef({ x: initial_x, y: initial_y });
    // 드래그 시작 시 기준 위치 저장용
    const startPos = useRef({ x: initial_x, y: initial_y });
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,  // 항상 드래그 시작 가능하도록 설정
                onMoveShouldSetPanResponder: () => true,  // 이동시에도 항상 드래그 가능하도록 설정

                onPanResponderGrant: () => {
                    pos.stopAnimation((value) => {
                        startPos.current = { x: value.x, y: value.y };
                    });
                },

                onPanResponderMove: (_, gesture) => {
                    setDraged(true)
                    const maxX = Math.max(0, boxSize.w - IMG_SIZE);
                    const maxY = Math.max(0, boxSize.h - IMG_SIZE);

                    const nextX = clamp(startPos.current.x + gesture.dx, 0, maxX);
                    const nextY = clamp(startPos.current.y + gesture.dy, 0, maxY);

                    pos.setValue({ x: nextX, y: nextY });
                },

                onPanResponderRelease: () => {
                    Animated.timing(pos, {
                        toValue: homePos.current,
                        duration: 180,
                        useNativeDriver: false,
                    }).start(() => {
                        setDraged(false);
                    });
                },

                onPanResponderTerminate: () => {
                    Animated.timing(pos, {
                        toValue: homePos.current,
                        duration: 180,
                        useNativeDriver: false,
                    }).start(() => {
                        setDraged(false);
                    });
                },
            }),
        [boxSize.w, boxSize.h]
    );

    const onBoxLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setBoxSize({ w: width, h: height });
    };

    return (
        <ImageBackground
            source={frameBackgroundImage}
            style={styles.frameBackground}
        >
            <View style={styles.frame} onLayout={onBoxLayout}>
                <Pressable
                    style={styles.characterPressArea}>
                    <Animated.View
                        style={[styles.characterWrap, { transform: pos.getTranslateTransform() }]}
                        {...panResponder.panHandlers}
                    ><EquippedCharacter size={IMG_SIZE} />
                    </Animated.View>

                </Pressable>

                <View style={styles.levelBox}>
                    <Text style={styles.levelText}>레벨 - </Text>
                    <Image
                        source={currentLevelInfo.image}
                        style={styles.levelImageStyle}
                    />
                    <Text style={styles.levelText}> {currentLevelInfo.label}</Text>
                </View>
            </View>
        </ImageBackground>
    );
};



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
const GoalItem = ({ goal, onToggleSuccess }: { goal: Goal; onToggleSuccess: () => void }) => {
    const router = useRouter();
    const { toggleGoalCompletion } = useGoalContext();
    const handleEdit = () => {
        router.push({
            pathname: '/(tabs)/goal/editgoal',
            params: { id: String(goal.id) }
        });
    };

    const handleToggle = async () => {
        try {
            // 1. 서버에 목표 완료 상태를 보냅니다 (await로 완료될 때까지 대기)
            await toggleGoalCompletion(goal.id);
            
            // 2. 서버 통신이 성공하면, 부모(MainScreen)가 준 함수를 실행합니다.
            // 이 함수가 실행되면서 MainScreen의 코인 정보가 새로고침됩니다.
            onToggleSuccess(); 
        } catch (error) {
            console.error("토글 실패:", error);
        }
    };
    // const handleToggle = () => {
    //     toggleGoalCompletion(goal.id);
    // };

    const imageSource = goal.is_completed
        ? require("../../assets/images/ON.png")
        : require("../../assets/images/OFF.png");

    return (
        <View style={styles.goalRow}>
            <Pressable
                style={styles.goalTextBox}
                onPress={() => handleEdit()}
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
// 목표 성공도
// const GoalGraph = () => {

// };

export default function MainScreen() {
    const router = useRouter();
    const { goals, } = useGoalContext();

    const handleGoGoal = () => {
        router.push('/(tabs)/goal');
    };

    const [userData, setUserData] = useState<any>(null);

    const fetchUserProfile = async () => {
        try {
        const response = await api.get('/users/me');
        setUserData(response.data);
        } catch (error) {
        console.error("유저 정보 로딩 실패:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
        fetchUserProfile();
        }, [])
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle='dark-content' backgroundColor='#000' />
            {/* 1. 헤더 영역 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>메인 화면</Text>
                <View style={styles.coinContainer}>
                    <Ionicons name="football" size={20} color="#000" />
                    <Text style={styles.coinText}>{userData?.cash ?? 0}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. 연속 성공도*/}
                <View style={styles.section}>
                    <View style={styles.successionSection}>
                        <Image
                            source={require("../../assets/images/mainpage/succession/fire.png")}
                            style={styles.successionImage}
                        />
                        <SuccessionDots streak={userData?.total_streak ?? 0}/>
                    </View>
                </View>
                {/* 2. 마스코트 영역 */}
                <View style={styles.section}>
                    <FrameScreen level={userData?.level ?? 1} />
                </View>
                {/* 3. 목표 영역 */}
                <View style={styles.section}>
                    <View style={styles.content}>
                        <TouchableOpacity onPress={handleGoGoal}>
                            <View style={styles.sectionHeader}>
                                <Image
                                    source={require("../../assets/images/hippo-hi.png")}
                                    style={styles.sectionImage}
                                    resizeMode="contain"
                                />
                                <Text style={styles.sectionTitle}>나의 목표</Text>
                            </View>
                        </TouchableOpacity>
                        <GoalListWithFakeScrollbar
                            items={goals.filter(goal => goal.period === '일일')}
                            height={150}
                            renderItem={(goal) => (
                                <View key={goal.id} style={styles.goalContainer}>
                                    <GoalItem 
                                        goal={goal} 
                                        onToggleSuccess={fetchUserProfile} 
                                    />
                                </View>
                            )}
                        />
                        <View style={{ height: 30 }} />
                    </View>

                </View>
                
            </ScrollView>


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
        paddingHorizontal: 20,
        paddingTop: 0,
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
        flex: 1,
        marginBottom: 5,
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 70,
    },
    sectionImage: {
        width: 35,
        marginRight: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    successionSection: {
        backgroundColor: 'white',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'black',
        marginVertical: 2,
        marginHorizontal: 18,
        paddingVertical: 5,
        flexDirection: 'row',
    },
    successionBox: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginLeft: 5,
    },
    successionText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    successionImage: {
        width: 50,
        height: 50,
        marginLeft: 16,
        marginRight: 5,
        marginVertical: 8,
    },
    successionDotBox: {
        flexDirection: 'row'
    },
    horizontalLine: {
        width: '110%',
        height: 2,
        backgroundColor: 'black',
        alignItems: 'center',
        marginVertical: 4,
    },
    frameBackground: {
        width: 330,
        height: 220,
        marginHorizontal: 'auto',
        borderWidth: 2,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    frame: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    characterImageStyle: {
        position: 'absolute',
        bottom: '10%',
        width: characterImageSize,
        height: characterImageSize * 95 / 90,
    },
    levelBox: {
        position: 'absolute',
        bottom: '5%',
        right: '3%',
        width: 110,
        paddingVertical: 2,
        borderWidth: 2,
        borderColor: 'black',
        backgroundColor: 'white',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    levelImageStyle: {
        width: levelImageSize,
        height: levelImageSize,
    },
    levelText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    goalContainer: {
        position: 'relative',
    },
    goalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 2,
        borderColor: '#E5E3E3',
        borderWidth: 1,
        borderRadius: 15,
        backgroundColor: '#F7F7F7',
        marginBottom: 4,
    },
    goalTextBox: {
        flex: 1,
        marginVertical: 5,
        marginRight: 20,
        justifyContent: 'center',
        marginLeft: 15,
    },
    goalText: {
        fontSize: 16,
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
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 5,
    },
    buttonImage: {
        width: 50,
        height: 50,
        resizeMode: "contain"
    },
    characterPressArea: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: '10%', // 마스코트 영역 위치를 프레임 내에서 조정
        width: 330,
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    characterWrap: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  coinText: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 15,
  },
});




