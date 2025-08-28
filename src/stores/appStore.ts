import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  AppStore, 
  AppState, 
  AppActions, 
  Viewport, 
  AppSettings,
  PopulationData,
  HeatmapLayer 
} from '@/types';

// 서울 초기 뷰포트 설정
const SEOUL_INITIAL_VIEWPORT: Viewport = {
  latitude: 37.5665,
  longitude: 126.9780,
  zoom: 11,
  bearing: 0,
  pitch: 0
};

// 기본 설정값
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'ko',
  refreshInterval: 10 * 60 * 1000, // 10분
  showFireIcons: true,
  enableNotifications: false,
  mapStyle: 'mapbox://styles/mapbox/light-v10'
};

// 기본 히트맵 레이어 설정
const DEFAULT_HEATMAP_LAYER: HeatmapLayer = {
  id: 'population-heatmap',
  visible: true,
  opacity: 0.7,
  radius: 20,
  intensity: 1
};

// 초기 상태
const initialState: AppState = {
  // UI 상태
  selectedRegion: null,
  isModalOpen: false,
  isLoading: false,
  error: null,
  
  // 지도 상태
  viewport: SEOUL_INITIAL_VIEWPORT,
  mapStyle: DEFAULT_SETTINGS.mapStyle,
  heatmapLayer: DEFAULT_HEATMAP_LAYER,
  
  // 데이터 상태
  populationData: [],
  lastUpdated: null,
  
  // 설정
  settings: DEFAULT_SETTINGS
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // UI 액션들
      setSelectedRegion: (regionId: string | null) => {
        set({ selectedRegion: regionId }, false, 'setSelectedRegion');
      },
      
      setModalOpen: (isOpen: boolean) => {
        set({ isModalOpen: isOpen }, false, 'setModalOpen');
        
        // 모달이 닫힐 때 선택된 지역도 초기화
        if (!isOpen) {
          set({ selectedRegion: null }, false, 'clearSelectedRegion');
        }
      },
      
      setLoading: (isLoading: boolean) => {
        set({ isLoading }, false, 'setLoading');
      },
      
      setError: (error: string | null) => {
        set({ error }, false, 'setError');
      },
      
      // 지도 액션들
      setViewport: (viewportUpdate: Partial<Viewport>) => {
        const currentViewport = get().viewport;
        const newViewport = { ...currentViewport, ...viewportUpdate };
        set({ viewport: newViewport }, false, 'setViewport');
      },
      
      setMapStyle: (style: string) => {
        set({ mapStyle: style }, false, 'setMapStyle');
        
        // 설정도 함께 업데이트
        const currentSettings = get().settings;
        set({ 
          settings: { ...currentSettings, mapStyle: style }
        }, false, 'updateMapStyleSetting');
      },
      
      updateHeatmapLayer: (layerUpdate: Partial<HeatmapLayer>) => {
        const currentLayer = get().heatmapLayer;
        const newLayer = { ...currentLayer, ...layerUpdate };
        set({ heatmapLayer: newLayer }, false, 'updateHeatmapLayer');
      },
      
      // 데이터 액션들
      setPopulationData: (data: PopulationData[]) => {
        set({ 
          populationData: data,
          lastUpdated: new Date(),
          error: null // 성공적으로 데이터를 받았으므로 에러 초기화
        }, false, 'setPopulationData');
      },
      
      updateLastUpdated: () => {
        set({ lastUpdated: new Date() }, false, 'updateLastUpdated');
      },
      
      // 설정 액션들
      updateSettings: (settingsUpdate: Partial<AppSettings>) => {
        const currentSettings = get().settings;
        const newSettings = { ...currentSettings, ...settingsUpdate };
        set({ settings: newSettings }, false, 'updateSettings');
        
        // 지도 스타일이 변경되었다면 지도 상태도 업데이트
        if (settingsUpdate.mapStyle && settingsUpdate.mapStyle !== get().mapStyle) {
          set({ mapStyle: settingsUpdate.mapStyle }, false, 'syncMapStyle');
        }
      },
      
      resetSettings: () => {
        set({ 
          settings: DEFAULT_SETTINGS,
          mapStyle: DEFAULT_SETTINGS.mapStyle,
          heatmapLayer: DEFAULT_HEATMAP_LAYER
        }, false, 'resetSettings');
      }
    }),
    {
      name: 'boombim-app-store', // Redux DevTools에서 표시될 이름
      partialize: (state) => ({
        // 지속되어야 할 상태만 선택 (localStorage에 저장됨)
        settings: state.settings,
        viewport: state.viewport,
        heatmapLayer: state.heatmapLayer
      })
    }
  )
);

// 선택자 함수들 (성능 최적화를 위한 메모화된 선택자)
export const selectUIState = (state: AppStore) => ({
  selectedRegion: state.selectedRegion,
  isModalOpen: state.isModalOpen,
  isLoading: state.isLoading,
  error: state.error
});

export const selectMapState = (state: AppStore) => ({
  viewport: state.viewport,
  mapStyle: state.mapStyle,
  heatmapLayer: state.heatmapLayer
});

export const selectDataState = (state: AppStore) => ({
  populationData: state.populationData,
  lastUpdated: state.lastUpdated
});

export const selectSettings = (state: AppStore) => state.settings;

// 유틸리티 선택자들
export const selectHotspots = (state: AppStore) => 
  state.populationData.filter(region => 
    region.population.changeRate > 0.3 && 
    (region.population.status === 'high' || region.population.status === 'critical')
  );

export const selectSelectedRegionData = (state: AppStore) => 
  state.selectedRegion 
    ? state.populationData.find(region => region.id === state.selectedRegion) || null
    : null;