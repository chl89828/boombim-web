import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { 
  PopulationData, 
  PopulationDataDocument,
  RegionDetails,
  ApiResponse 
} from '@/types';

/**
 * 실시간 유동인구 데이터를 가져오는 서비스
 */
export class PopulationService {
  private static instance: PopulationService;
  
  private constructor() {}
  
  public static getInstance(): PopulationService {
    if (!PopulationService.instance) {
      PopulationService.instance = new PopulationService();
    }
    return PopulationService.instance;
  }

  /**
   * 최신 유동인구 데이터를 실시간으로 구독
   */
  public subscribeToPopulationData(
    callback: (data: PopulationData[]) => void,
    onError: (error: Error) => void
  ): () => void {
    try {
      const q = query(
        collection(db, 'population_data'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            callback([]);
            return;
          }

          const doc = snapshot.docs[0];
          const documentData = doc.data() as PopulationDataDocument;
          
          // regions 객체를 배열로 변환
          const populationData = Object.values(documentData.regions || {});
          callback(populationData);
        },
        (error) => {
          console.error('Population data subscription error:', error);
          onError(new Error('Failed to fetch population data'));
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to population data:', error);
      onError(new Error('Failed to initialize population data subscription'));
      return () => {}; // 빈 unsubscribe 함수 반환
    }
  }

  /**
   * 특정 지역의 상세 정보를 가져옵니다
   */
  public async getRegionDetails(regionId: string): Promise<ApiResponse<RegionDetails>> {
    try {
      const docRef = doc(db, 'regions', regionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Region with ID ${regionId} not found`,
            timestamp: new Date().toISOString()
          }
        };
      }

      const regionData = docSnap.data() as RegionDetails;

      return {
        success: true,
        data: regionData
      };
    } catch (error) {
      console.error('Failed to get region details:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch region details',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 유동인구 데이터의 통계 정보를 계산합니다
   */
  public calculateStatistics(data: PopulationData[]) {
    if (!data.length) {
      return {
        totalRegions: 0,
        averagePopulation: 0,
        highDensityAreas: 0,
        criticalAreas: 0
      };
    }

    const totalPopulation = data.reduce((sum, region) => sum + region.population.current, 0);
    const averagePopulation = totalPopulation / data.length;
    
    const highDensityAreas = data.filter(
      region => region.population.status === 'high'
    ).length;
    
    const criticalAreas = data.filter(
      region => region.population.status === 'critical'
    ).length;

    return {
      totalRegions: data.length,
      averagePopulation: Math.round(averagePopulation),
      highDensityAreas,
      criticalAreas
    };
  }

  /**
   * 유동인구 급증 지역을 찾습니다 (불꽃 아이콘 표시용)
   */
  public getHotspots(data: PopulationData[], threshold: number = 0.3): PopulationData[] {
    return data.filter(region => 
      region.population.changeRate > threshold && 
      region.population.status === 'high' || region.population.status === 'critical'
    );
  }

  /**
   * 지역별 색상을 결정합니다 (히트맵용)
   */
  public getRegionColor(population: PopulationData['population']): string {
    switch (population.status) {
      case 'low':
        return '#3B82F6'; // Blue
      case 'normal':
        return '#10B981'; // Green
      case 'high':
        return '#F59E0B'; // Yellow
      case 'critical':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * 유동인구 변화율에 따른 텍스트 표현을 생성합니다
   */
  public getChangeDescription(changeRate: number): string {
    if (changeRate > 0.5) return '매우 붐빔 🔥🔥';
    if (changeRate > 0.25) return '평소보다 붐빔 📈';
    if (changeRate > 0) return '약간 붐빔 ↗️';
    if (changeRate === 0) return '평소와 비슷함 ➡️';
    if (changeRate > -0.25) return '약간 한산함 ↘️';
    if (changeRate > -0.5) return '평소보다 한산함 📉';
    return '매우 한산함 😴';
  }
}

// 싱글톤 인스턴스 내보내기
export const populationService = PopulationService.getInstance();