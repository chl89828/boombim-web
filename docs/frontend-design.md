# BoomBim Frontend 설계

## 📋 개요

React + TypeScript 기반의 현대적인 웹 애플리케이션으로, 반응형 디자인과 우수한 UX를 제공합니다.

## 🏗️ 컴포넌트 아키텍처

```
App
├── Layout
│   ├── Header
│   ├── Sidebar (Future)
│   └── Footer
├── MapContainer
│   ├── MapView (Mapbox)
│   ├── HeatmapLayer
│   ├── FireIcons
│   └── MapControls
├── DetailsModal
│   ├── PopulationChart
│   ├── RegionInfo
│   └── TrendGraph
├── LoadingSpinner
└── ErrorBoundary
```

## 🎨 디자인 시스템

### 색상 팔레트
```css
:root {
  /* Primary Colors */
  --primary-orange: #FF4C29;
  --primary-yellow: #F2A21F;
  --primary-blue: #3366FF;
  
  /* Heatmap Colors */
  --heat-low: #3B82F6;      /* Blue */
  --heat-medium: #F59E0B;   /* Yellow */
  --heat-high: #EF4444;     /* Red */
  --heat-critical: #DC2626; /* Dark Red */
  
  /* UI Colors */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --border: #E2E8F0;
  
  /* Status Colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
}
```

### 타이포그래피
```css
/* Font Family */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

.font-primary {
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Font Sizes */
.text-xs { font-size: 0.75rem; }    /* 12px */
.text-sm { font-size: 0.875rem; }   /* 14px */
.text-base { font-size: 1rem; }     /* 16px */
.text-lg { font-size: 1.125rem; }   /* 18px */
.text-xl { font-size: 1.25rem; }    /* 20px */
.text-2xl { font-size: 1.5rem; }    /* 24px */
.text-3xl { font-size: 1.875rem; }  /* 30px */
```

## 📱 컴포넌트 상세 설계

### 1. MapView Component

```typescript
interface MapViewProps {
  data: PopulationData[];
  onRegionClick: (regionId: string) => void;
  isLoading: boolean;
  className?: string;
}

interface MapViewState {
  viewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  selectedRegion: string | null;
}

// 컴포넌트 구조
const MapView: FC<MapViewProps> = ({
  data,
  onRegionClick,
  isLoading,
  className
}) => {
  const [viewport, setViewport] = useState(SEOUL_INITIAL_VIEWPORT);
  const [heatmapLayer, setHeatmapLayer] = useState<mapboxgl.Layer | null>(null);
  
  // Mapbox 지도 초기화 및 레이어 추가
  useEffect(() => {
    initializeMap();
    addHeatmapLayer(data);
    addFireIcons(data);
  }, [data]);
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
      
      <MapControls
        onZoomIn={() => map.zoomIn()}
        onZoomOut={() => map.zoomOut()}
        onResetView={() => setViewport(SEOUL_INITIAL_VIEWPORT)}
      />
    </div>
  );
};
```

### 2. HeatmapLayer Component

```typescript
interface HeatmapData {
  coordinates: [number, number];
  population: number;
  intensity: number; // 0-1 normalized
}

const HeatmapLayer: FC<{
  map: mapboxgl.Map;
  data: HeatmapData[];
}> = ({ map, data }) => {
  useEffect(() => {
    // GeoJSON 데이터 생성
    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: data.map(point => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point.coordinates
        },
        properties: {
          population: point.population,
          intensity: point.intensity
        }
      }))
    };
    
    // Mapbox 히트맵 레이어 추가
    if (map.getSource('population-heatmap')) {
      (map.getSource('population-heatmap') as mapboxgl.GeoJSONSource)
        .setData(geojsonData);
    } else {
      map.addSource('population-heatmap', {
        type: 'geojson',
        data: geojsonData
      });
      
      map.addLayer({
        id: 'population-heatmap-layer',
        type: 'heatmap',
        source: 'population-heatmap',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            1, 1
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': {
            stops: [
              [11, 15],
              [15, 20]
            ]
          },
          'heatmap-opacity': 0.7
        }
      });
    }
  }, [map, data]);
  
  return null; // 이 컴포넌트는 렌더링하지 않음
};
```

### 3. DetailsModal Component

```typescript
interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: RegionDetails | null;
  className?: string;
}

const DetailsModal: FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  region,
  className
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // ESC 키로 모달 닫기
  useKeydown('Escape', onClose);
  
  // 모달 외부 클릭으로 닫기
  useOutsideClick(modalRef, onClose);
  
  if (!isOpen || !region) return null;
  
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-2xl shadow-2xl
            w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto
            transform transition-all duration-300 ease-out
            ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            ${className}
          `}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {region.name}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Population Status */}
            <div className="mt-4 flex items-center gap-3">
              <PopulationBadge
                current={region.population.current}
                changeRate={region.population.changeRate}
              />
              <span className="text-2xl">
                {region.population.changeRate > 0.2 ? '🔥' : '📊'}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* 현재 인구 */}
            <PopulationStats
              current={region.population.current}
              baseline={region.population.baseline}
              changeRate={region.population.changeRate}
            />
            
            {/* 시간대별 그래프 */}
            <HourlyChart data={region.population.hourlyData} />
            
            {/* 주간 트렌드 */}
            <WeeklyTrend data={region.population.weeklyTrend} />
            
            {/* 핫스팟 정보 */}
            {region.hotspots && (
              <NearbyHotspots hotspots={region.hotspots} />
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};
```

### 4. Custom Hooks

```typescript
// hooks/usePopulationData.ts
export const usePopulationData = (refreshInterval = 10 * 60 * 1000) => {
  return useQuery({
    queryKey: ['population-data'],
    queryFn: async (): Promise<PopulationData[]> => {
      const response = await firebase
        .firestore()
        .collection('population_data')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
        
      if (response.empty) {
        throw new Error('No population data available');
      }
      
      const doc = response.docs[0];
      return Object.values(doc.data().regions) as PopulationData[];
    },
    staleTime: refreshInterval,
    cacheTime: refreshInterval * 2,
    refetchInterval: refreshInterval,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

// hooks/useRegionDetails.ts
export const useRegionDetails = (regionId: string | null) => {
  return useQuery({
    queryKey: ['region-details', regionId],
    queryFn: async (): Promise<RegionDetails> => {
      if (!regionId) throw new Error('Region ID is required');
      
      const response = await firebase
        .firestore()
        .collection('regions')
        .doc(regionId)
        .get();
        
      if (!response.exists) {
        throw new Error('Region not found');
      }
      
      return response.data() as RegionDetails;
    },
    enabled: Boolean(regionId),
    staleTime: 30 * 60 * 1000, // 30분
  });
};

// hooks/useMapbox.ts
export const useMapbox = (container: string, initialViewport: Viewport) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  
  useEffect(() => {
    const mapInstance = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [initialViewport.longitude, initialViewport.latitude],
      zoom: initialViewport.zoom,
      accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    });
    
    mapInstance.on('load', () => {
      setMap(mapInstance);
    });
    
    return () => mapInstance.remove();
  }, [container, initialViewport]);
  
  return map;
};
```

## 📊 상태 관리

### Zustand Store

```typescript
// stores/appStore.ts
interface AppState {
  // UI 상태
  selectedRegion: string | null;
  isModalOpen: boolean;
  
  // 지도 상태
  viewport: Viewport;
  mapStyle: string;
  
  // 설정
  refreshInterval: number;
  showFireIcons: boolean;
  
  // Actions
  setSelectedRegion: (regionId: string | null) => void;
  setModalOpen: (isOpen: boolean) => void;
  setViewport: (viewport: Viewport) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // 초기 상태
  selectedRegion: null,
  isModalOpen: false,
  viewport: SEOUL_INITIAL_VIEWPORT,
  mapStyle: 'mapbox://styles/mapbox/light-v10',
  refreshInterval: 10 * 60 * 1000,
  showFireIcons: true,
  
  // Actions
  setSelectedRegion: (regionId) => 
    set({ selectedRegion: regionId }),
    
  setModalOpen: (isOpen) => 
    set({ isModalOpen: isOpen }),
    
  setViewport: (viewport) => 
    set({ viewport }),
    
  updateSettings: (settings) => 
    set((state) => ({ ...state, ...settings }))
}));
```

## 🎭 애니메이션 설계

### Framer Motion 활용

```typescript
// components/AnimatedModal.tsx
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 500,
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

const AnimatedModal: FC<ModalProps> = ({ isOpen, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="modal-content"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

## 🧪 테스팅 전략

```typescript
// tests/MapView.test.tsx
describe('MapView Component', () => {
  const mockData = [
    {
      id: 'test-region',
      coordinates: [127.027619, 37.497952],
      population: { current: 1000, baseline: 800 }
    }
  ];
  
  test('renders map container', () => {
    render(
      <MapView
        data={mockData}
        onRegionClick={jest.fn()}
        isLoading={false}
      />
    );
    
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
  
  test('shows loading spinner when loading', () => {
    render(
      <MapView
        data={[]}
        onRegionClick={jest.fn()}
        isLoading={true}
      />
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  test('calls onRegionClick when region is clicked', async () => {
    const mockOnRegionClick = jest.fn();
    
    render(
      <MapView
        data={mockData}
        onRegionClick={mockOnRegionClick}
        isLoading={false}
      />
    );
    
    // Mapbox 이벤트 시뮬레이션
    fireEvent.click(screen.getByTestId('region-test-region'));
    
    expect(mockOnRegionClick).toHaveBeenCalledWith('test-region');
  });
});
```

## 📱 반응형 디자인

```css
/* Tailwind 기반 반응형 설계 */
.map-container {
  @apply w-full h-screen;
  
  /* Mobile */
  @screen sm {
    @apply h-[70vh];
  }
  
  /* Tablet */
  @screen md {
    @apply h-[80vh];
  }
  
  /* Desktop */
  @screen lg {
    @apply h-screen;
  }
}

.details-modal {
  @apply w-full max-w-sm mx-4;
  
  @screen md {
    @apply max-w-lg;
  }
  
  @screen lg {
    @apply max-w-xl;
  }
}
```

## 🚀 성능 최적화

1. **컴포넌트 최적화**:
   - React.memo로 불필요한 리렌더링 방지
   - useMemo/useCallback로 연산 최적화
   - Code splitting으로 번들 크기 최적화

2. **지도 성능**:
   - Viewport culling으로 보이는 영역만 렌더링
   - 레이어 최적화 및 중복 제거
   - 이미지 스프라이트 사용

3. **데이터 최적화**:
   - React Query로 데이터 캐싱
   - Debouncing으로 API 호출 최적화
   - 가상화로 대용량 데이터 처리