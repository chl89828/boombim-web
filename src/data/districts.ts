import { District } from '@/types/pictogram';

export const SEOUL_DISTRICTS: District[] = [
  // Row 0
  { id: 'dobong', name: '도봉구', nameEn: 'Dobong-gu', gridPosition: { row: 0, col: 0 } },
  { id: 'nowon', name: '노원구', nameEn: 'Nowon-gu', gridPosition: { row: 0, col: 1 } },
  
  // Row 1  
  { id: 'eunpyeong', name: '은평구', nameEn: 'Eunpyeong-gu', gridPosition: { row: 1, col: 0 } },
  { id: 'seongbuk', name: '성북구', nameEn: 'Seongbuk-gu', gridPosition: { row: 1, col: 1 } },
  { id: 'jungnang', name: '중랑구', nameEn: 'Jungnang-gu', gridPosition: { row: 1, col: 2 } },
  
  // Row 2
  { id: 'seodaemun', name: '서대문구', nameEn: 'Seodaemun-gu', gridPosition: { row: 2, col: 0 } },
  { id: 'jongno', name: '종로구', nameEn: 'Jongno-gu', gridPosition: { row: 2, col: 1 } },
  { id: 'seongdong', name: '성동구', nameEn: 'Seongdong-gu', gridPosition: { row: 2, col: 2 } },
  { id: 'gwangjin', name: '광진구', nameEn: 'Gwangjin-gu', gridPosition: { row: 2, col: 3 } },
  
  // Row 3
  { id: 'mapo', name: '마포구', nameEn: 'Mapo-gu', gridPosition: { row: 3, col: 0 } },
  { id: 'jung', name: '중구', nameEn: 'Jung-gu', gridPosition: { row: 3, col: 1 } },
  { id: 'dongdaemun', name: '동대문구', nameEn: 'Dongdaemun-gu', gridPosition: { row: 3, col: 2 } },
  { id: 'gangdong', name: '강동구', nameEn: 'Gangdong-gu', gridPosition: { row: 3, col: 4 } },
  
  // Row 4
  { id: 'yongsan', name: '용산구', nameEn: 'Yongsan-gu', gridPosition: { row: 4, col: 1 } },
  { id: 'songpa', name: '송파구', nameEn: 'Songpa-gu', gridPosition: { row: 4, col: 4 } },
  
  // Row 5
  { id: 'yeongdeungpo', name: '영등포구', nameEn: 'Yeongdeungpo-gu', gridPosition: { row: 5, col: 0 } },
  { id: 'dongjak', name: '동작구', nameEn: 'Dongjak-gu', gridPosition: { row: 5, col: 1 } },
  { id: 'seocho', name: '서초구', nameEn: 'Seocho-gu', gridPosition: { row: 5, col: 2 } },
  { id: 'gangnam', name: '강남구', nameEn: 'Gangnam-gu', gridPosition: { row: 5, col: 3 } },
  
  // Row 6
  { id: 'guro', name: '구로구', nameEn: 'Guro-gu', gridPosition: { row: 6, col: 0 } },
  { id: 'gwanak', name: '관악구', nameEn: 'Gwanak-gu', gridPosition: { row: 6, col: 1 } },
  
  // Row 7
  { id: 'geumcheon', name: '금천구', nameEn: 'Geumcheon-gu', gridPosition: { row: 7, col: 1 } },
  
  // Additional districts that might need repositioning
  { id: 'yangcheon', name: '양천구', nameEn: 'Yangcheon-gu', gridPosition: { row: 4, col: 0 } },
  { id: 'gangseo', name: '강서구', nameEn: 'Gangseo-gu', gridPosition: { row: 5, col: -1 } }, // 왼쪽 확장
  { id: 'gangbuk', name: '강북구', nameEn: 'Gangbuk-gu', gridPosition: { row: 0, col: 2 } },
];

export const PICTOGRAM_CONFIG = {
  gridSize: { rows: 8, cols: 5 },
  tileSize: { width: 80, height: 80 },
  spacing: 8,
  colors: {
    population: {
      min: '#3B82F6', // blue-500
      max: '#EF4444', // red-500
      steps: ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']
    },
    density: {
      min: '#E0E7FF', // indigo-100
      max: '#312E81', // indigo-900
      steps: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1']
    },
    change: {
      min: '#DBEAFE', // blue-100
      max: '#1E3A8A', // blue-900
      steps: ['#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6']
    }
  }
};

export const getDistrictColor = (
  value: number, 
  minValue: number, 
  maxValue: number, 
  colorScale: 'population' | 'density' | 'change' = 'population'
): string => {
  if (maxValue === minValue) return PICTOGRAM_CONFIG.colors[colorScale].steps[2];
  
  const normalized = Math.max(0, Math.min(1, (value - minValue) / (maxValue - minValue)));
  const steps = PICTOGRAM_CONFIG.colors[colorScale].steps;
  const stepIndex = Math.floor(normalized * (steps.length - 1));
  
  return steps[stepIndex];
};