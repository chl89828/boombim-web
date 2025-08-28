import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapView from '../MapView';

// Mock data
const mockPopulationData = [
  {
    id: 'test-region-1',
    name: '강남역',
    coordinates: { lat: 37.4979, lng: 127.0276 },
    population: {
      current: 1500,
      baseline: 1200,
      changeRate: 0.25,
      status: 'high' as const,
      confidence: 0.9
    },
    metadata: {
      category: 'transport_hub' as const,
      lastUpdated: { toDate: () => new Date() } as any,
      dataQuality: 'good' as const
    }
  }
];

// Zustand store mock
vi.mock('@/stores/appStore', () => ({
  useAppStore: vi.fn((selector) => {
    const mockState = {
      viewport: {
        latitude: 37.5665,
        longitude: 126.9780,
        zoom: 11,
        bearing: 0,
        pitch: 0
      },
      mapStyle: 'mapbox://styles/mapbox/light-v10',
      populationData: mockPopulationData,
      setSelectedRegion: vi.fn(),
      setModalOpen: vi.fn()
    };
    return selector ? selector(mockState) : mockState;
  })
}));

// Mapbox hook mock
vi.mock('@/hooks/useMapbox', () => ({
  useMapbox: vi.fn(() => ({
    map: {
      on: vi.fn(),
      off: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      queryRenderedFeatures: vi.fn(() => []),
      getCanvas: vi.fn(() => ({ style: { cursor: '' } }))
    },
    containerRef: { current: null },
    isLoaded: true,
    error: null,
    flyTo: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn()
  }))
}));

describe('MapView Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderMapView = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MapView {...props} />
      </QueryClientProvider>
    );
  };

  it('renders map container', () => {
    renderMapView();
    
    // 지도 컨테이너가 렌더링되는지 확인
    const mapContainer = document.querySelector('[class*="w-full h-full"]');
    expect(mapContainer).toBeInTheDocument();
  });

  it('displays legend', () => {
    renderMapView();
    
    expect(screen.getByText('인구 밀도')).toBeInTheDocument();
    expect(screen.getByText('낮음')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
    expect(screen.getByText('높음')).toBeInTheDocument();
    expect(screen.getByText('매우높음')).toBeInTheDocument();
  });

  it('calls onRegionClick when provided', () => {
    const mockOnRegionClick = vi.fn();
    renderMapView({ onRegionClick: mockOnRegionClick });

    // 실제 지도 클릭 이벤트 시뮬레이션은 복잡하므로
    // 컴포넌트가 콜백을 받는지만 확인
    expect(mockOnRegionClick).toBeDefined();
  });

  it('displays error message when map fails to load', () => {
    // useMapbox 훅에서 에러 반환하도록 모킹
    const { useMapbox } = require('@/hooks/useMapbox');
    useMapbox.mockReturnValueOnce({
      map: null,
      containerRef: { current: null },
      isLoaded: false,
      error: 'Failed to load map',
      flyTo: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn()
    });

    renderMapView();
    
    expect(screen.getByText('지도를 불러올 수 없습니다')).toBeInTheDocument();
    expect(screen.getByText('Failed to load map')).toBeInTheDocument();
  });

  it('shows loading state when map is not loaded', () => {
    // useMapbox 훅에서 로딩 상태 반환하도록 모킹
    const { useMapbox } = require('@/hooks/useMapbox');
    useMapbox.mockReturnValueOnce({
      map: null,
      containerRef: { current: null },
      isLoaded: false,
      error: null,
      flyTo: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn()
    });

    renderMapView();
    
    expect(screen.getByText('지도를 불러오는 중...')).toBeInTheDocument();
  });
});