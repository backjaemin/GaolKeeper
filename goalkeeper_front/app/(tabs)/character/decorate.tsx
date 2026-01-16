import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useRef } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Alert,
    ActivityIndicator,
    Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../../src/app'; 

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 3;

// 🟢 1. '피부색' 카테고리 다시 추가
type Category = '배경' | '피부색' | '안경' | '모자' | '액세서리';

// 🟢 2. DB 타입 매핑 (body -> 피부색)
const DB_TYPE_MAPPING: Record<string, Category> = {
    'background': '배경',
    'face': '안경',
    'head': '모자',
    'neck': '액세서리',
    'body': '피부색' // body 타입의 액세서리는 '피부색' 탭으로!
};

const Z_INDEX_MAP: Record<string, number> = {
    'background': 0, 
    'body': 15,      // 마스코트 위에 덧씌워짐 (코스튬)
    'neck': 20,
    'face': 30,
    'head': 40       
};

// 🟢 3. 카테고리 목록 정의 ('피부색' 포함)
const CATEGORIES: { id: Category; label: string; icon: any }[] = [
    { id: '피부색', label: '피부색', icon: 'tshirt-crew-outline' }, // 아이콘 변경 (옷 느낌)
    { id: '모자', label: '모자', icon: 'hat-fedora' },
    { id: '안경', label: '안경', icon: 'glasses' },
    { id: '액세서리', label: '액세서리', icon: 'ring' },
    { id: '배경', label: '배경', icon: 'image-outline' },
];

interface DecorationItem {
    ui_id: string;
    original_id: number;
    name: string;
    price: number;
    image_url: string;
    isOwned: boolean;
    isEquipped: boolean;
    itemType: 'accessory'; // 마스코트는 취급 안 함
    typeStr: string; 
}

export default function DecorationScreen() {
    const router = useRouter();
    // 🟢 기본 탭을 '피부색'으로 설정 (원하시면 변경 가능)
    const [selectedCategory, setSelectedCategory] = useState<Category>('피부색');
    const [loading, setLoading] = useState(true);
    const [myCash, setMyCash] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [items, setItems] = useState<Record<Category, DecorationItem[]>>({
        '배경': [], '피부색': [], '안경': [], '모자': [], '액세서리': []
    });

    const [equippedBackground, setEquippedBackground] = useState<any>(null); 
    const [equippedMascot, setEquippedMascot] = useState<any>(null);       
    const [equippedAccessories, setEquippedAccessories] = useState<any[]>([]); 

    const getImageUrl = (path: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const serverOrigin = api.defaults.baseURL?.split('/api')[0];
        return `${serverOrigin}${path}`;
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            const [userRes, accRes, myAccsRes, equippedMascotRes, equippedAccRes] = await Promise.all([
                api.get('/users/me'),
                api.get('/accessories/'),     // 액세서리 목록 (메로나 하마 포함)
                api.get('/accessories/my'),
                api.get('/mascots/equipped').catch(() => ({ data: null })),
                api.get('/accessories/equipped').catch(() => ({ data: [] }))
            ]);

            setMyCash(userRes.data.cash);
            
            // 1. 현재 장착된 몸체 (프리뷰용)
            const currentMascotData = equippedMascotRes.data?.mascot || equippedMascotRes.data;
            setEquippedMascot(currentMascotData);

            // 2. 현재 장착된 액세서리들 (화면 표시용)
            const currentEquippedAccs = Array.isArray(equippedAccRes.data) ? equippedAccRes.data : [];
            const equippedAccIds: number[] = [];
            
            let bgItem = null;
            const otherItems: any[] = [];

            currentEquippedAccs.forEach((item: any) => {
                if (!item.accessory) return;
                equippedAccIds.push(item.accessory_id);

                if (item.accessory.type === 'background') {
                    bgItem = item.accessory; 
                } else {
                    otherItems.push(item.accessory);
                }
            });

            setEquippedBackground(bgItem);
            setEquippedAccessories(otherItems);

            // 3. 리스트 데이터 가공 (🟢 여기가 핵심!)
            const myAccIds = myAccsRes.data.map((a:any) => Number(a.accessory_id));
            
            // 초기화
            const newItems: Record<Category, DecorationItem[]> = {
                '배경': [], '피부색': [], '안경': [], '모자': [], '액세서리': []
            };

            // 🟢 중요: 마스코트(Mascot) 데이터는 아예 반복문도 안 돌립니다.
            // 오직 액세서리(Accessory) 데이터만 분류합니다.
            accRes.data.forEach((acc: any) => {
                const categoryName = DB_TYPE_MAPPING[acc.type]; 
                
                // DB 매핑에 있고('body' -> '피부색'), 우리 카테고리 목록에도 있는 것만 추가
                if (categoryName && newItems[categoryName]) {
                    newItems[categoryName].push({
                        ui_id: `acc-${acc.accessory_id}`,
                        original_id: acc.accessory_id,
                        name: acc.name,
                        price: acc.price,
                        image_url: acc.image_url,
                        isOwned: myAccIds.includes(Number(acc.accessory_id)),
                        isEquipped: equippedAccIds.includes(Number(acc.accessory_id)),
                        itemType: 'accessory',
                        typeStr: acc.type
                    });
                }
            });

            setItems(newItems);

        } catch (error) {
            console.error("데이터 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const handleItemPress = async (item: DecorationItem) => {
        // 액세서리 로직만 남김
        const endpoint = 'accessories';
        
        if (item.isEquipped) {
             try {
                 await api.post(`/${endpoint}/${item.original_id}/unequip`);
                 fetchData();
             } catch (error) { console.error(error); }
             return; 
        }

        if (item.isOwned) {
            try {
                await api.post(`/${endpoint}/${item.original_id}/equip`);
                fetchData();
            } catch (error) { Alert.alert("오류", "장착 실패"); }
        } else {
            Alert.alert("구매 확인", `${item.price} 코인으로 구매하시겠습니까?`, [
                { text: "취소", style: "cancel" },
                {
                    text: "구매",
                    onPress: async () => {
                        try {
                            await api.post(`/${endpoint}/${item.original_id}/buy`);
                            await api.post(`/${endpoint}/${item.original_id}/equip`);
                            fetchData();
                            setShowToast(true); 
                            Animated.sequence([
                                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                                Animated.delay(1500),
                                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                            ]).start(() => setShowToast(false));
                        } catch (error: any) {
                            Alert.alert("구매 실패", error.response?.data?.detail || "잔액이 부족합니다.");
                        }
                    }
                }
            ]);
        }
    };

    const currentList = items[selectedCategory] || [];

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>액세서리 상점</Text> 
                <View style={styles.coinContainer}>
                    <Ionicons name="football" size={20} color="#000" />
                    <Text style={styles.coinText}>{myCash}</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* 프리뷰 카드 */}
                <View style={styles.previewCard}>
                    
                    {/* 1. 배경 */}
                    {equippedBackground && getImageUrl(equippedBackground.image_url) && (
                         <Image 
                            source={{ uri: getImageUrl(equippedBackground.image_url) as string }} 
                            style={styles.backgroundImage} 
                            resizeMode="stretch"
                        />
                    )}

                    {/* 캐릭터 영역 */}
                    <View style={styles.previewImageContainer}>
                        
                        {/* 2. 몸체 (기본 마스코트) */}
                        {equippedMascot && getImageUrl(equippedMascot.image_url) && (
                            <Image 
                                source={{ uri: getImageUrl(equippedMascot.image_url) as string }} 
                                style={[styles.layeredImage, { zIndex: 10 }]} 
                                resizeMode="contain" 
                            />
                        )}

                        {/* 3. 액세서리들 (메로나 하마 포함) */}
                        {equippedAccessories.map((acc, index) => {
                            const fullUrl = getImageUrl(acc.image_url);
                            if (!fullUrl) return null;
                            const zIndex = Z_INDEX_MAP[acc.type] || 20;

                            return (
                                <Image 
                                    key={acc.accessory_id || index} 
                                    source={{ uri: fullUrl }} 
                                    style={[styles.layeredImage, { zIndex: zIndex }]} 
                                    resizeMode="contain"
                                />
                            );
                        })}
                    </View>

                    {/* 텍스트 정보 */}
                    <View style={styles.previewInfo}>
                        <View style={styles.textWrapper}> 
                            <View style={styles.nameRow}>
                                <Text style={styles.characterName}>{equippedMascot?.name || "캐릭터 없음"}</Text>
                            </View>
                            <Text style={styles.description} numberOfLines={2}>
                                {equippedMascot?.description || "멋지게 꾸며주세요!"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 카테고리 바 */}
                <View style={styles.categoryBar}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryItem, selectedCategory === cat.id && styles.activeCategoryItem]}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <MaterialCommunityIcons 
                                name={cat.icon as any} 
                                size={24} 
                                color={selectedCategory === cat.id ? "#000" : "#999"} 
                            />
                            <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.activeCategoryLabel]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 아이템 그리드 */}
                <View style={styles.itemGridContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#000" style={{marginTop: 50}} />
                    ) : currentList.length > 0 ? (
                        <View style={styles.grid}>
                            {currentList.map((item) => {
                                const fullUrl = getImageUrl(item.image_url);
                                return (
                                    <TouchableOpacity
                                        key={item.ui_id}
                                        style={[styles.itemCard, item.isEquipped && styles.equippedCard]}
                                        activeOpacity={0.7}
                                        onPress={() => handleItemPress(item)}
                                    >
                                        <View style={styles.itemImageContainer}>
                                            {fullUrl ? (
                                                <Image source={{ uri: fullUrl }} style={styles.itemImage} resizeMode="contain" />
                                            ) : (
                                                <Ionicons name="shirt-outline" size={32} color="#ddd" />
                                            )}
                                            {item.isEquipped && (
                                                <View style={styles.equippedBadge}>
                                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                                </View>
                                            )}
                                            {!item.isOwned && (
                                                <View style={styles.priceOverlay}>
                                                    <Text style={styles.priceText}>💰 {item.price}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="file-tray-outline" size={48} color="#ddd" />
                            <Text style={styles.emptyText}>아이템이 없습니다.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

             {showToast && (
                <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
                    <Ionicons name="checkmark-circle" size={36} color="#fff" />
                    <Text style={styles.toastText}>구매 완료!</Text>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F8FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerIcon: { width: 40 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    coinContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    coinText: { marginLeft: 4, fontWeight: '600' },
    content: { flex: 1 },
    
    // 프리뷰 카드
    previewCard: { 
        flexDirection: 'row', 
        padding: 20, 
        backgroundColor: '#F5F2F7', 
        alignItems: 'center',
        overflow: 'hidden', 
        minHeight: 160,     
        position: 'relative' 
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject, 
        zIndex: 0, 
    },
    previewImageContainer: { 
        width: 120, 
        height: 120, 
        marginRight: 15, 
        position: 'relative', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'transparent',
        zIndex: 10 
    },
    layeredImage: { 
        position: 'absolute', 
        width: '100%', 
        height: '100%', 
        top: 0, 
        left: 0 
    },
    previewInfo: { 
        flex: 1,
        zIndex: 10 
    },
    textWrapper: {
        backgroundColor: 'rgba(255,255,255,0.6)', 
        padding: 10,
        borderRadius: 8
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    characterName: { fontSize: 20, fontWeight: 'bold', marginRight: 8 },
    description: { fontSize: 12, color: '#333', marginBottom: 5 },
    
    // 카테고리 바
    categoryBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', justifyContent: 'space-around' },
    categoryItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeCategoryItem: { borderBottomColor: '#000' },
    categoryLabel: { fontSize: 12, color: '#999', marginTop: 4 },
    activeCategoryLabel: { color: '#000', fontWeight: 'bold' },
    
    // 아이템 그리드
    itemGridContainer: { padding: 16, paddingBottom: 100 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 },
    itemCard: { width: ITEM_WIDTH, height: ITEM_WIDTH * 1.3, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'transparent', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    equippedCard: { borderColor: '#000' },
    itemImageContainer: { width: '80%', height: '65%', backgroundColor: '#f9f9f9', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' },
    itemImage: { width: '80%', height: '80%' },
    itemName: { fontSize: 12, color: '#333', fontWeight: '500' },
    equippedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    priceOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 2, alignItems: 'center' },
    priceText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
    emptyText: { color: '#ccc', marginTop: 10 },
    
    // 토스트
    toastContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -75 }, { translateY: -50 }], width: 150, height: 100, backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
    toastText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 10 },
});