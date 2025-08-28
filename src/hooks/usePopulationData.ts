import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { populationService } from '@/services/population';
import { useAppStore } from '@/stores/appStore';
import type { PopulationData, UsePopulationDataOptions } from '@/types';

/**
 * 유동인구 데이터를 실시간으로 가져오는 훅
 */
export const usePopulationData = (options: UsePopulationDataOptions = {}) => {
  const {
    refreshInterval = 10 * 60 * 1000, // 10분 기본값
    enabled = true,
    regionIds,
    minPopulation,
    status
  } = options;

  const queryClient = useQueryClient();
  const { setPopulationData, setLoading, setError } = useAppStore();

  // React Query를 사용한 데이터 캐싱
  const query = useQuery({
    queryKey: ['population-data', { regionIds, minPopulation, status }],
    queryFn: async (): Promise<PopulationData[]> => {
      return new Promise((resolve, reject) => {
        const unsubscribe = populationService.subscribeToPopulationData(
          (data) => {
            // 필터 조건 적용
            let filteredData = data;
            
            if (regionIds && regionIds.length > 0) {
              filteredData = filteredData.filter(region => 
                regionIds.includes(region.id)
              );
            }
            
            if (minPopulation !== undefined) {
              filteredData = filteredData.filter(region => 
                region.population.current >= minPopulation
              );
            }
            
            if (status) {
              filteredData = filteredData.filter(region => 
                region.population.status === status
              );
            }
            
            resolve(filteredData);
            unsubscribe();
          },
          (error) => {
            reject(error);
            unsubscribe();
          }
        );
      });
    },
    staleTime: refreshInterval,
    cacheTime: refreshInterval * 2,
    refetchInterval: refreshInterval,
    enabled,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      setPopulationData(data);
      setError(null);
    },
    onError: (error) => {
      console.error('Population data fetch error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  // 로딩 상태를 store에 동기화
  useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading, setLoading]);

  // 실시간 구독 설정
  useEffect(() => {
    if (!enabled || !query.data) return;

    const unsubscribe = populationService.subscribeToPopulationData(
      (data) => {
        // 캐시 업데이트
        queryClient.setQueryData(
          ['population-data', { regionIds, minPopulation, status }], 
          data
        );
        setPopulationData(data);
      },
      (error) => {
        console.error('Real-time subscription error:', error);
        setError(error.message);
      }
    );

    return unsubscribe;
  }, [enabled, query.data, queryClient, regionIds, minPopulation, status, setPopulationData, setError]);

  // 수동 새로고침 함수
  const refresh = useCallback(() => {
    return query.refetch();
  }, [query]);

  // 통계 계산
  const statistics = query.data 
    ? populationService.calculateStatistics(query.data)
    : null;

  // 핫스팟 데이터
  const hotspots = query.data 
    ? populationService.getHotspots(query.data)
    : [];

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    statistics,
    hotspots,
    refresh
  };
};