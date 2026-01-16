import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
// Expo 기본 벡터 아이콘 라이브러리 import
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { GoalProvider } from '../../components/GoalContext'; // 메인화면에서도 목표데이터 쓰기 때문에 Goalprovider사용

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <GoalProvider> 
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarInactiveTintColor: '#888', // 선택되지 않은 아이콘 색상 (회색)
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false, // 라벨(글자) 숨기기
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute', // iOS에서 배경 블러 효과 등을 위해
            },
            default: {},
          }),
        }}>
        
        {/* 1. 홈 (집 모양) */}
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={28} 
                color={color} 
              />
            ),
          }}
        />
        
        {/* 2. 목표 (화살 꽂힌 과녁) */}
        <Tabs.Screen
          name="goal"
          options={{
            title: 'Goal',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons 
                name="bullseye-arrow" 
                size={28} 
                color={color} 
              />
            ),
          }}
        />

        {/* addgoal은 탭 바에서 숨기기 */}
        {/* <Tabs.Screen 
          name="goal/addgoal" 
          options={{ 
            href: null, // 이 설정이 중요합니다! 탭 바에 아이콘이 생기지 않아요.
            headerShown: true,
            title: '목표 추가하기'
          }} 
        /> */}
        {/* editgoal은 탭 바에서 숨기기 */}
        {/* <Tabs.Screen 
          name="goal/editgoal" 
          options={{ 
            href: null, // 이 설정이 중요합니다! 탭 바에 아이콘이 생기지 않아요.
            headerShown: true,
            title: '목표 추가하기'
          }} 
        /> */}
        
        {/* 3. 캐릭터 (4각 별/반짝임) */}
        <Tabs.Screen
          name="character"
          options={{
            title: '캐릭터',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons 
                name={focused ? "star-four-points" : "star-four-points-outline"} 
                size={30} 
                color={color} 
              />
            ),
          }}
        />
        


        {/* 4. 채팅 (줄이 그어진 네모 말풍선) */}
        <Tabs.Screen
          name="community"
          options={{
            title: 'community',
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons 
                name={focused ? "message-text" : "message-text-outline"} 
                size={28} 
                color={color} 
              />
            ),
          }}
        />

        {/* 5. 설정 (톱니바퀴) */}
        <Tabs.Screen
          name="config"
          options={{
            title: 'Config',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? "settings" : "settings-outline"} 
                size={28} 
                color={color} 
              />
            ),
          }}
        />

      </Tabs>

    </GoalProvider>
    
    
  );
}