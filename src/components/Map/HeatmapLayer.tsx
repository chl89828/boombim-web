import React, { useEffect } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useAppStore, selectMapState } from '@/stores/appStore';
import type { PopulationData } from '@/types';

interface HeatmapData {
  coordinates: [number, number];
  population: number;
  intensity: number; // 0-1 normalized
}

interface HeatmapLayerProps {
  map: MapboxMap;
  data: PopulationData[];
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ map, data }) => {
  const { heatmapLayer } = useAppStore(selectMapState);

  useEffect(() => {
    if (!map || !data.length) return;

    try {
      // 인구 밀도 정규화를 위한 최대값 계산
      const maxPopulation = Math.max(...data.map(region => region.population.current));
      const minPopulation = Math.min(...data.map(region => region.population.current));
      const populationRange = maxPopulation - minPopulation || 1;

      // GeoJSON 데이터 생성
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: data.map(region => {
          // 인구 밀도를 0-1 범위로 정규화
          const normalizedIntensity = (region.population.current - minPopulation) / populationRange;
          
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [region.coordinates.lng, region.coordinates.lat]
            },
            properties: {
              id: region.id,
              name: region.name,
              population: region.population.current,
              intensity: normalizedIntensity,
              status: region.population.status,
              changeRate: region.population.changeRate
            }
          };
        })
      };

      // 히트맵 데이터 소스 추가 또는 업데이트
      if (map.getSource('population-heatmap')) {
        (map.getSource('population-heatmap') as mapboxgl.GeoJSONSource)
          .setData(geojsonData);
      } else {
        map.addSource('population-heatmap', {
          type: 'geojson',
          data: geojsonData
        });

        // 히트맵 레이어 추가
        map.addLayer({
          id: 'population-heatmap-layer',
          type: 'heatmap',
          source: 'population-heatmap',
          maxzoom: 15,
          paint: {
            // 히트맵 가중치 (인구 밀도 기반)
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'intensity'],
              0, 0,
              1, 1
            ],
            
            // 히트맵 색상 그라데이션
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',      // 투명
              0.2, 'rgb(103,169,207)',      // 연한 파랑
              0.4, 'rgb(209,229,240)',      // 하늘색
              0.6, 'rgb(253,219,199)',      // 연한 주황
              0.8, 'rgb(239,138,98)',       // 주황
              1, 'rgb(178,24,43)'           // 빨강
            ],
            
            // 히트맵 반지름 (줌 레벨에 따라 조정)
            'heatmap-radius': {
              stops: [
                [11, heatmapLayer.radius || 15],
                [15, (heatmapLayer.radius || 15) + 5]
              ]
            },
            
            // 히트맵 투명도
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7, heatmapLayer.opacity || 0.7,
              14, (heatmapLayer.opacity || 0.7) * 0.5,
              15, 0
            ],
            
            // 히트맵 강도
            'heatmap-intensity': heatmapLayer.intensity || 1
          }
        }, 'waterway-label'); // 라벨 아래에 배치
      }

      // 레이어 가시성 설정
      map.setLayoutProperty(
        'population-heatmap-layer', 
        'visibility', 
        heatmapLayer.visible ? 'visible' : 'none'
      );

      // 레이어 투명도 업데이트
      if (map.getLayer('population-heatmap-layer')) {
        map.setPaintProperty(
          'population-heatmap-layer',
          'heatmap-opacity',
          [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, heatmapLayer.opacity || 0.7,
            14, (heatmapLayer.opacity || 0.7) * 0.5,
            15, 0
          ]
        );
      }

    } catch (error) {
      console.error('Failed to update heatmap layer:', error);
    }
  }, [map, data, heatmapLayer]);

  // 컴포넌트 언마운트 시 레이어 정리
  useEffect(() => {
    return () => {
      if (map && map.getLayer('population-heatmap-layer')) {
        try {
          map.removeLayer('population-heatmap-layer');
        } catch (error) {
          console.warn('Failed to remove heatmap layer:', error);
        }
      }
      
      if (map && map.getSource('population-heatmap')) {
        try {
          map.removeSource('population-heatmap');
        } catch (error) {
          console.warn('Failed to remove heatmap source:', error);
        }
      }
    };
  }, [map]);

  // 이 컴포넌트는 지도에 직접 레이어를 추가하므로 렌더링하지 않음
  return null;
};

export default HeatmapLayer;