import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../src/app'; // axios 인스턴스 경로 확인
import { Alert } from 'react-native';

// 1. 타입 정의 (재민님이 정의한 최신 규격)
export type GoalPeriod = '일일' | '주간' | '월간' | '연간';
export type Category = '학업' | '취미' | '건강' | '기타' | '없음';

export interface Goal {
  id: number;
  title: string;
  period: GoalPeriod;
  category: Category;
  memo: string;
  is_completed: boolean;
  currentStreak: number;
}

type GoalContextValue = {
  goals: Goal[];
  loading: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (title: string, period: GoalPeriod, category: Category, memo: string) => Promise<void>;
  toggleGoalCompletion: (id: number) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  updateGoal: (id: number, title: string, period: GoalPeriod, category: Category, memo: string) => Promise<void>;
};

const GoalContext = createContext<GoalContextValue | null>(null);

export const useGoalContext = () => {
  const context = useContext(GoalContext);
  if (!context) throw new Error('useGoalContext must be used within a GoalProvider');
  return context;
};

export const GoalProvider = ({ children }: { children: React.ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  // 2. [GET] 내 목표 목록 가져오기
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/goals/');
      const mappedGoals: Goal[] = response.data.map((g: any) => ({
        id: g.goal_id,
        title: g.title,
        period: g.period as GoalPeriod,
        category: g.category as Category,
        memo: g.memo || '',
        // 오늘 날짜와 마지막 인증 날짜를 비교하여 완료 여부 판단
        is_completed: g.last_verified_at?.split('T')[0] === new Date().toISOString().split('T')[0],
        currentStreak: g.current_streak || 0,
      }));
      setGoals(mappedGoals);
    } catch (error) {
      console.error('목표 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // 3. [POST] 목표 추가
  const addGoal = async (title: string, period: GoalPeriod, category: Category, memo: string) => {
    try {
      const response = await api.post('/goals/', {
        title,
        period,
        category,
        memo,
      });

      const newGoal: Goal = {
        id: response.data.goal_id,
        title,
        period,
        category,
        memo,
        is_completed: false,
        currentStreak: 0,
      };
      setGoals((prev) => [...prev, newGoal]);
    } catch (error) {
      console.error('목표 추가 실패:', error);
      throw error;
    }
  };

  // 4. [POST] 목표 완료 체크 (오늘의 인증)
  const toggleGoalCompletion = async (id: number) => {
    try {
      const response = await api.post(`/goals/${id}/check`);
      
      const { rewards_breakdown, gained_cash } = response.data;
      // 보상 내역 문자열 만들기
      const detailMessage = rewards_breakdown.map(item => `• ${item.label}: +${item.amount}G`).join('\n')

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === id 
            ? { ...goal, is_completed: true, currentStreak: response.data.current_streak } 
            : goal
        )
      );
      Alert.alert(
      "🎉 인증 성공!",
      `총 ${gained_cash}G를 획득했습니다!\n\n[상세 내역]\n${detailMessage}`,
      [{ text: "확인" }]
    );
    } catch (error: any) {
      // 이미 오늘 완료한 경우 등에 대한 백엔드 에러 메시지 처리
      const errorMsg = error.response?.data?.detail || "이미 오늘 인증을 완료했습니다.";
      alert(errorMsg);
    }
  };

  // 5. [DELETE] 목표 삭제
  const deleteGoal = async (id: number) => {
    try {
      await api.delete(`/goals/${id}`);
      setGoals((prev) => prev.filter((goal) => goal.id !== id));
    } catch (error) {
      console.error('목표 삭제 실패:', error);
    }
  };

  // 6. [PATCH] 목표 수정
  const updateGoal = async (id: number, title: string, period: GoalPeriod, category: Category, memo: string) => {
    try {
      await api.patch(`/goals/${id}`, {
        title,
        period,
        category,
        memo,
      });

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === id 
            ? { ...goal, title, period, category, memo } 
            : goal
        )
      );
    } catch (error) {
      console.error('목표 수정 실패:', error);
      throw error;
    }
  };

  return (
    <GoalContext.Provider value={{ goals, loading, fetchGoals, addGoal, toggleGoalCompletion, deleteGoal, updateGoal }}>
      {children}
    </GoalContext.Provider>
  );
};