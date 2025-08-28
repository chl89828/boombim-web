import { useQuery } from '@tanstack/react-query';
import { populationService } from '@/services/population';
import type { RegionDetails, UseRegionDetailsOptions } from '@/types';

/**
 * 특정 지역의 상세 정보를 가져오는 훅
 */
export const useRegionDetails = (options: UseRegionDetailsOptions) => {
  const {
    regionId,
    enabled = Boolean(regionId),
    includeHistorical = false
  } = options;

  const query = useQuery({
    queryKey: ['region-details', regionId, includeHistorical],
    queryFn: async (): Promise<RegionDetails | null> => {
      if (!regionId) return null;

      const response = await populationService.getRegionDetails(regionId);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch region details');
      }

      return response.data || null;
    },
    enabled: enabled && Boolean(regionId),
    staleTime: 30 * 60 * 1000, // 30분
    cacheTime: 60 * 60 * 1000, // 1시간
    retry: 2,
    retryDelay: 1000
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  };
};