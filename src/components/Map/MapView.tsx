import React, { useEffect, useCallback, useRef } from 'react';
import { useMapbox } from '@/hooks/useMapbox';
import { useAppStore, selectMapState, selectDataState } from '@/stores/appStore';
import { populationService } from '@/services/population';
import HeatmapLayer from './HeatmapLayer';
import FireIcons from './FireIcons';
import MapControls from './MapControls';
import type { PopulationData } from '@/types';

interface MapViewProps {
  className?: string;
  onRegionClick?: (regionId: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ 
  className = '', 
  onRegionClick 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { viewport, mapStyle } = useAppStore(selectMapState);
  const { populationData } = useAppStore(selectDataState);
  const { setSelectedRegion, setModalOpen } = useAppStore();

  // Mapbox 훅 사용
  const { 
    map, 
    containerRef, 
    isLoaded, 
    error, 
    flyTo, 
    addSource, 
    addLayer 
  } = useMapbox({
    container: mapContainerRef.current || '',
    style: mapStyle,
    center: [viewport.longitude, viewport.latitude],
    zoom: viewport.zoom
  });

  // 지역 클릭 핸들러
  const handleRegionClick = useCallback((regionId: string, regionData: PopulationData) => {
    console.log('Region clicked:', regionId, regionData);
    
    // 지역 선택 및 모달 열기
    setSelectedRegion(regionId);
    setModalOpen(true);
    
    // 해당 지역으로 지도 이동
    flyTo({
      latitude: regionData.coordinates.lat,
      longitude: regionData.coordinates.lng,
      zoom: 14
    });

    // 외부 핸들러 호출
    onRegionClick?.(regionId);
  }, [setSelectedRegion, setModalOpen, flyTo, onRegionClick]);

  // 지도 클릭 이벤트 설정
  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['population-points', 'population-clusters']
      });

      if (features.length > 0) {
        const feature = features[0];
        const regionId = feature.properties?.id;
        
        if (regionId) {
          const regionData = populationData.find(region => region.id === regionId);
          if (regionData) {
            handleRegionClick(regionId, regionData);
          }
        }
      }
    };

    // 마우스 커서 변경
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', handleMapClick);
    map.on('mouseenter', 'population-points', handleMouseEnter);
    map.on('mouseleave', 'population-points', handleMouseLeave);
    map.on('mouseenter', 'population-clusters', handleMouseEnter);
    map.on('mouseleave', 'population-clusters', handleMouseLeave);

    return () => {
      map.off('click', handleMapClick);
      map.off('mouseenter', 'population-points', handleMouseEnter);
      map.off('mouseleave', 'population-points', handleMouseLeave);
      map.off('mouseenter', 'population-clusters', handleMouseEnter);
      map.off('mouseleave', 'population-clusters', handleMouseLeave);
    };
  }, [map, isLoaded, populationData, handleRegionClick]);

  // 인구 데이터 포인트 추가
  useEffect(() => {
    if (!map || !isLoaded || !populationData.length) return;

    try {
      // GeoJSON 데이터 생성
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: populationData.map(region => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [region.coordinates.lng, region.coordinates.lat]
          },
          properties: {
            id: region.id,
            name: region.name,
            population: region.population.current,
            changeRate: region.population.changeRate,
            status: region.population.status,
            color: populationService.getRegionColor(region.population)
          }
        }))
      };

      // 데이터 소스 추가/업데이트
      addSource('population-data', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // 클러스터 레이어 추가
      addLayer({
        id: 'population-clusters',
        type: 'circle',
        source: 'population-data',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            20,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15,
            10,
            20,
            20,
            25
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // 클러스터 숫자 레이어
      addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'population-data',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // 개별 포인트 레이어
      addLayer({
        id: 'population-points',
        type: 'circle',
        source: 'population-data',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            0, 4,
            1000, 8,
            5000, 12,
            10000, 16
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      });

    } catch (err) {
      console.error('Failed to add population data to map:', err);
    }
  }, [map, isLoaded, populationData, addSource, addLayer]);

  // 맵 컨트롤 핸들러들
  const handleZoomIn = useCallback(() => {
    if (map) {
      map.zoomIn();
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.zoomOut();
    }
  }, [map]);

  const handleResetView = useCallback(() => {
    flyTo({
      latitude: 37.5665,
      longitude: 126.9780,
      zoom: 11
    });
  }, [flyTo]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-500 text-lg font-medium mb-2">
            지도를 불러올 수 없습니다
          </div>
          <div className="text-gray-600 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 지도 컨테이너 */}
      <div 
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-orange"></div>
            <div className="text-gray-600">지도를 불러오는 중...</div>
          </div>
        </div>
      )}

      {/* 히트맵 레이어 */}
      {map && isLoaded && (
        <HeatmapLayer 
          map={map} 
          data={populationData}
        />
      )}

      {/* 불꽃 아이콘 */}
      {map && isLoaded && (
        <FireIcons 
          map={map} 
          data={populationData}
          onClick={handleRegionClick}
        />
      )}

      {/* 지도 컨트롤 */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        className="absolute top-4 right-4 z-10"
      />

      {/* 범례 */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <div className="text-sm font-medium mb-2">인구 밀도</div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-3 h-3 rounded-full bg-heat-low"></div>
          <span>낮음</span>
          <div className="w-3 h-3 rounded-full bg-heat-medium"></div>
          <span>보통</span>
          <div className="w-3 h-3 rounded-full bg-heat-high"></div>
          <span>높음</span>
          <div className="w-3 h-3 rounded-full bg-heat-critical"></div>
          <span>매우높음</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;