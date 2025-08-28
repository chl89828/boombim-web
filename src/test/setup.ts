import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Jest DOM matchers 확장
expect.extend(matchers);

// 각 테스트 후 정리
afterEach(() => {
  cleanup();
});

// Mapbox GL JS 모킹
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
      getSource: vi.fn(),
      getLayer: vi.fn(),
      setLayoutProperty: vi.fn(),
      setPaintProperty: vi.fn(),
      flyTo: vi.fn(),
      easeTo: vi.fn(),
      fitBounds: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getCenter: vi.fn(() => ({ lat: 37.5665, lng: 126.9780 })),
      getZoom: vi.fn(() => 11),
      getBearing: vi.fn(() => 0),
      getPitch: vi.fn(() => 0),
      getCanvas: vi.fn(() => ({
        style: { cursor: '' }
      })),
      queryRenderedFeatures: vi.fn(() => [])
    })),
    NavigationControl: vi.fn(),
    ScaleControl: vi.fn(),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn(() => ({
        addTo: vi.fn()
      })),
      remove: vi.fn(),
      getElement: vi.fn(() => ({
        style: { display: 'block' }
      }))
    }))
  }
}));

// Firebase 모킹
vi.mock('../services/firebase', () => ({
  db: {},
  auth: {},
  default: {}
}));

// 환경 변수 모킹
Object.defineProperty(window, 'import', {
  value: {
    meta: {
      env: {
        VITE_MAPBOX_ACCESS_TOKEN: 'test-token',
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_APP_ENV: 'test',
        DEV: true,
        PROD: false
      }
    }
  }
});

// ResizeObserver 모킹 (차트 컴포넌트용)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserver 모킹
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// matchMedia 모킹 (반응형 테스트용)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});