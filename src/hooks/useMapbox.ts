import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAppStore } from '@/stores/appStore';
import type { UseMapboxOptions, Viewport } from '@/types';

// Mapbox access token 설정
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

/**
 * Mapbox GL JS 지도를 관리하는 훅
 */
export const useMapbox = (options: UseMapboxOptions) => {
  const {
    container,
    style = 'mapbox://styles/mapbox/light-v10',
    center = [126.9780, 37.5665], // 서울 좌표
    zoom = 11,
    accessToken
  } = options;

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { viewport, setViewport, mapStyle } = useAppStore();

  // access token 설정
  useEffect(() => {
    if (accessToken) {
      mapboxgl.accessToken = accessToken;
    }
  }, [accessToken]);

  // 지도 초기화
  useEffect(() => {
    if (!container && !containerRef.current) return;

    try {
      // access token 검증
      if (!mapboxgl.accessToken) {
        throw new Error('Mapbox access token is required. Please set VITE_MAPBOX_ACCESS_TOKEN environment variable.');
      }

      const mapContainer = typeof container === 'string' 
        ? document.getElementById(container) || containerRef.current
        : container || containerRef.current;

      if (!mapContainer) {
        throw new Error('Map container not found');
      }

      const map = new mapboxgl.Map({
        container: mapContainer,
        style: mapStyle || style,
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        bearing: viewport.bearing || 0,
        pitch: viewport.pitch || 0,
        antialias: true,
        optimizeForTerrain: true
      });

      // 지도 컨트롤 추가
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

      // 지도 이벤트 리스너
      map.on('load', () => {
        setIsLoaded(true);
        setError(null);
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e.error);
        setError(e.error?.message || 'Map loading failed');
      });

      // viewport 변경 이벤트 리스너
      const updateViewport = () => {
        const center = map.getCenter();
        const newViewport: Viewport = {
          latitude: center.lat,
          longitude: center.lng,
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch()
        };
        setViewport(newViewport);
      };

      map.on('moveend', updateViewport);
      map.on('zoomend', updateViewport);
      map.on('rotateend', updateViewport);
      map.on('pitchend', updateViewport);

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
        setIsLoaded(false);
      };
    } catch (err) {
      console.error('Failed to initialize Mapbox:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
    }
  }, [container, style, mapStyle]);

  // viewport 변경 시 지도 업데이트 (외부에서 변경된 경우)
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    const map = mapRef.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // 현재 위치와 비교해서 변경된 경우에만 업데이트
    const centerChanged = 
      Math.abs(currentCenter.lat - viewport.latitude) > 0.0001 ||
      Math.abs(currentCenter.lng - viewport.longitude) > 0.0001;
    
    const zoomChanged = Math.abs(currentZoom - viewport.zoom) > 0.1;

    if (centerChanged || zoomChanged) {
      map.easeTo({
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        bearing: viewport.bearing || 0,
        pitch: viewport.pitch || 0,
        duration: 1000
      });
    }
  }, [viewport, isLoaded]);

  // 지도 스타일 변경
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    try {
      mapRef.current.setStyle(mapStyle || style);
    } catch (err) {
      console.error('Failed to update map style:', err);
      setError(err instanceof Error ? err.message : 'Failed to update map style');
    }
  }, [mapStyle, style, isLoaded]);

  // 유틸리티 함수들
  const flyTo = useCallback((viewport: Partial<Viewport>) => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [viewport.longitude || 126.9780, viewport.latitude || 37.5665],
      zoom: viewport.zoom || 11,
      bearing: viewport.bearing || 0,
      pitch: viewport.pitch || 0,
      duration: 2000
    });
  }, []);

  const fitBounds = useCallback((bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => {
    if (!mapRef.current) return;

    mapRef.current.fitBounds(bounds, {
      padding: 50,
      duration: 1000,
      ...options
    });
  }, []);

  const addSource = useCallback((id: string, source: mapboxgl.AnySourceData) => {
    if (!mapRef.current || !isLoaded) return;

    try {
      if (mapRef.current.getSource(id)) {
        mapRef.current.removeSource(id);
      }
      mapRef.current.addSource(id, source);
    } catch (err) {
      console.error(`Failed to add source ${id}:`, err);
    }
  }, [isLoaded]);

  const addLayer = useCallback((layer: mapboxgl.AnyLayer, beforeId?: string) => {
    if (!mapRef.current || !isLoaded) return;

    try {
      if (mapRef.current.getLayer(layer.id)) {
        mapRef.current.removeLayer(layer.id);
      }
      mapRef.current.addLayer(layer, beforeId);
    } catch (err) {
      console.error(`Failed to add layer ${layer.id}:`, err);
    }
  }, [isLoaded]);

  return {
    map: mapRef.current,
    containerRef,
    isLoaded,
    error,
    flyTo,
    fitBounds,
    addSource,
    addLayer
  };
};