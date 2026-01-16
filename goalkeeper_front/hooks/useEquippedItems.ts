// hooks/useEquippedItems.ts
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import api from '../src/app';

export const useEquippedItems = () => {
  const [data, setData] = useState<{ mascot: any; background: any; accessories: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEquipped = useCallback(async () => {
    try {
      setLoading(true);
      const [mascotRes, accRes] = await Promise.all([
        api.get('/mascots/equipped').catch(() => ({ data: null })),
        api.get('/accessories/equipped').catch(() => ({ data: [] }))
      ]);

      const accList = Array.isArray(accRes.data) ? accRes.data : [];
      const background = accList.find((a: any) => a.accessory?.type === 'background')?.accessory;
      const others = accList.filter((a: any) => a.accessory?.type !== 'background').map((a: any) => a.accessory);

      setData({
        mascot: mascotRes.data?.mascot || mascotRes.data,
        background,
        accessories: others
      });
    } catch (e) {
      console.error("장착 데이터 로드 실패", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchEquipped(); }, [fetchEquipped]));

  return { data, loading, refetch: fetchEquipped };
};