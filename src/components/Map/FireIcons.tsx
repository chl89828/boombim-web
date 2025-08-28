import React, { useEffect, useState } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { populationService } from '@/services/population';
import { useAppStore, selectSettings, selectHotspots } from '@/stores/appStore';
import type { PopulationData } from '@/types';

interface FireIconsProps {
  map: MapboxMap;
  data: PopulationData[];
  onClick?: (regionId: string, regionData: PopulationData) => void;
}

const FireIcons: React.FC<FireIconsProps> = ({ map, data, onClick }) => {
  const settings = useAppStore(selectSettings);
  const hotspots = useAppStore(selectHotspots);
  const [fireMarkers, setFireMarkers] = useState<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map || !settings.showFireIcons) {
      // 기존 마커들 제거
      fireMarkers.forEach(marker => marker.remove());
      setFireMarkers([]);
      return;
    }

    // 기존 마커들 제거
    fireMarkers.forEach(marker => marker.remove());

    // 핫스팟 지역 필터링 (급증 지역)
    const hotspotRegions = populationService.getHotspots(data, 0.3);

    if (hotspotRegions.length === 0) {
      setFireMarkers([]);
      return;
    }

    // 새로운 불꽃 마커들 생성
    const newMarkers = hotspotRegions.map(region => {
      // 불꽃 아이콘 생성
      const fireElement = document.createElement('div');
      fireElement.className = 'fire-icon';
      fireElement.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="text-2xl animate-pulse-fire select-none">
            ${region.population.changeRate > 0.5 ? '🔥🔥' : '🔥'}
          </div>
          <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 
                      opacity-0 group-hover:opacity-100 transition-opacity
                      bg-black text-white text-xs rounded px-2 py-1 pointer-events-none
                      whitespace-nowrap z-50">
            ${region.name}<br/>
            ${populationService.getChangeDescription(region.population.changeRate)}
          </div>
        </div>
      `;

      // 클릭 이벤트 추가
      fireElement.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick?.(region.id, region);
      });

      // 마커 생성 및 지도에 추가
      const marker = new mapboxgl.Marker({
        element: fireElement,
        anchor: 'bottom'
      })
        .setLngLat([region.coordinates.lng, region.coordinates.lat])
        .addTo(map);

      return marker;
    });

    setFireMarkers(newMarkers);

    // 컴포넌트 언마운트 시 마커들 정리
    return () => {
      newMarkers.forEach(marker => marker.remove());
    };
  }, [map, data, settings.showFireIcons, onClick]);

  // 설정 변경 시 마커 표시/숨김 토글
  useEffect(() => {
    fireMarkers.forEach(marker => {
      const element = marker.getElement();
      if (settings.showFireIcons) {
        element.style.display = 'block';
      } else {
        element.style.display = 'none';
      }
    });
  }, [settings.showFireIcons, fireMarkers]);

  // 이 컴포넌트는 지도에 직접 마커를 추가하므로 렌더링하지 않음
  return null;
};

export default FireIcons;