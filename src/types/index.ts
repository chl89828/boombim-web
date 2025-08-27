// BoomBim 프로젝트 TypeScript 타입 정의

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// 공통 타입
// ============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoCoordinates extends Coordinates {
  accuracy?: number;
}

export type PopulationStatus = 'low' | 'normal' | 'high' | 'critical';
export type DataQuality = 'good' | 'fair' | 'poor';
export type RegionCategory = 'transport_hub' | 'commercial' | 'residential' | 'entertainment' | 'cultural';

// ============================================================================
// 유동인구 데이터 관련 타입
// ============================================================================

export interface PopulationInfo {
  current: number;
  baseline: number;
  changeRate: number; // -1.0 to 1.0
  status: PopulationStatus;
  confidence: number; // 0 to 1
}

export interface PopulationData {
  id: string;
  name: string;
  coordinates: Coordinates;
  population: PopulationInfo;
  metadata: {
    category: RegionCategory;
    lastUpdated: Timestamp;
    dataQuality: DataQuality;
  };
}

export interface PopulationDataDocument {
  timestamp: Timestamp;
  dataSource: string;
  totalRegions: number;
  processingTimeMs: number;
  regions: Record<string, PopulationData>;
  metadata: {
    apiVersion: string;
    processingVersion: string;
    errorCount: number;
    successRate: number;
  };
}

// ============================================================================
// 지역 정보 관련 타입
// ============================================================================

export interface NearbyPlace {
  name: string;
  type: 'subway' | 'bus' | 'cafe' | 'restaurant' | 'shopping' | 'park';
  distance: number; // 미터 단위
  coordinates: Coordinates;
}

export interface BaselineStats {
  averagePopulation: number;
  peakHours: number[]; // 0-23
  quietHours: number[];
  weekdayMultiplier: number;
  weekendMultiplier: number;
}

export interface RegionDocument {
  id: string;
  name: string;
  nameEng: string;
  description: string;
  coordinates: GeoCoordinates;
  boundaries: Coordinates[];
  category: RegionCategory;
  subcategory?: string;
  baselineStats: BaselineStats;
  nearbyPlaces: NearbyPlace[];
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    version: string;
    dataSource: string[];
    isActive: boolean;
    priority: number; // 1-10
  };
}

export interface RegionDetails extends RegionDocument {
  population: PopulationInfo & {
    hourlyData: HourlyPopulation[];
    weeklyTrend: WeeklyTrend[];
  };
  hotspots: NearbyPlace[];
}

// ============================================================================
// 과거 데이터 관련 타입
// ============================================================================

export interface HourlyPopulation {
  hour: number; // 0-23
  population: number;
  changeRate: number;
  dataPoints: number;
  confidence: number;
}

export interface WeeklyTrend {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  avgPopulation: number;
  peakHour: number;
  quietHour: number;
}

export interface DailySummary {
  minPopulation: number;
  maxPopulation: number;
  averagePopulation: number;
  peakHour: number;
  quietHour: number;
  totalDataPoints: number;
  averageChangeRate: number;
}

export interface WeatherData {
  condition: string;
  temperature: number;
  rainfall: number;
}

export interface RegionEvent {
  name: string;
  type: string;
  impact: 'low' | 'medium' | 'high';
}

export interface HistoricalDataDocument {
  regionId: string;
  date: string; // YYYY-MM-DD
  hourlyData: HourlyPopulation[];
  dailySummary: DailySummary;
  weatherData?: WeatherData;
  events?: RegionEvent[];
  metadata: {
    createdAt: Timestamp;
    dataQuality: DataQuality;
    completeness: number; // 0-1
  };
}

// ============================================================================
// 시스템 설정 관련 타입
// ============================================================================

export interface ApiConfig {
  refreshInterval: number; // milliseconds
  timeoutMs: number;
  retryCount: number;
  batchSize: number;
}

export interface PopulationThresholds {
  lowPopulation: number;
  highPopulation: number;
  criticalPopulation: number;
  changeRateHigh: number;
}

export interface FeatureFlags {
  fireIconsEnabled: boolean;
  historicalDataEnabled: boolean;
  weatherIntegration: boolean;
  realtimeUpdates: boolean;
}

export interface MaintenanceInfo {
  lastBackup: Timestamp;
  nextScheduledMaintenance: Timestamp;
  version: string;
}

export interface SystemConfigDocument {
  api: ApiConfig;
  thresholds: PopulationThresholds;
  features: FeatureFlags;
  maintenance: MaintenanceInfo;
}

export interface ApiSourceStatus {
  status: 'active' | 'inactive' | 'error';
  lastResponse: Timestamp;
  errorMessage?: string;
  responseTimeMs: number;
  successRate24h: number;
}

export interface ApiMetrics {
  totalRequests24h: number;
  successfulRequests24h: number;
  averageResponseTime: number;
  peakUsage: Timestamp;
}

export interface ApiStatusDocument {
  lastSuccessfulFetch: Timestamp;
  lastFailedFetch?: Timestamp;
  consecutiveFailures: number;
  sources: Record<string, ApiSourceStatus>;
  metrics: ApiMetrics;
}

// ============================================================================
// UI 컴포넌트 관련 타입
// ============================================================================

export interface Viewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
}

export interface HeatmapLayer {
  id: string;
  visible: boolean;
  opacity: number;
  radius: number;
  intensity: number;
}

export interface FireIcon {
  id: string;
  coordinates: Coordinates;
  intensity: number; // 0-1
  animation: 'pulse' | 'glow' | 'static';
}

export interface PopupContent {
  regionId: string;
  name: string;
  population: PopulationInfo;
  nearbyPlaces?: NearbyPlace[];
}

// ============================================================================
// API 응답 관련 타입
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
  meta?: {
    totalCount?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface PopulationDataResponse extends ApiResponse<{
  timestamp: string;
  regions: PopulationData[];
  meta: {
    totalRegions: number;
    updateInterval: string;
    dataSource: string;
  };
}> {}

export interface RegionDetailsResponse extends ApiResponse<{
  region: RegionDetails;
}> {}

// ============================================================================
// React Hook 관련 타입
// ============================================================================

export interface UsePopulationDataOptions {
  refreshInterval?: number;
  enabled?: boolean;
  regionIds?: string[];
  minPopulation?: number;
  status?: PopulationStatus;
}

export interface UseMapboxOptions {
  container: string | HTMLElement;
  style: string;
  center: [number, number];
  zoom: number;
  accessToken: string;
}

export interface UseRegionDetailsOptions {
  regionId: string | null;
  enabled?: boolean;
  includeHistorical?: boolean;
}

// ============================================================================
// State Management 관련 타입 (Zustand)
// ============================================================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en';
  refreshInterval: number;
  showFireIcons: boolean;
  enableNotifications: boolean;
  mapStyle: string;
}

export interface AppState {
  // UI 상태
  selectedRegion: string | null;
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 지도 상태
  viewport: Viewport;
  mapStyle: string;
  heatmapLayer: HeatmapLayer;
  
  // 데이터 상태
  populationData: PopulationData[];
  lastUpdated: Date | null;
  
  // 설정
  settings: AppSettings;
}

export interface AppActions {
  // UI 액션
  setSelectedRegion: (regionId: string | null) => void;
  setModalOpen: (isOpen: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 지도 액션
  setViewport: (viewport: Partial<Viewport>) => void;
  setMapStyle: (style: string) => void;
  updateHeatmapLayer: (layer: Partial<HeatmapLayer>) => void;
  
  // 데이터 액션
  setPopulationData: (data: PopulationData[]) => void;
  updateLastUpdated: () => void;
  
  // 설정 액션
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export type AppStore = AppState & AppActions;

// ============================================================================
// Error 관련 타입
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  stack?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  response?: any;
}

// ============================================================================
// Utility 타입들
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 환경 변수 타입
export interface EnvironmentVariables {
  VITE_MAPBOX_ACCESS_TOKEN: string;
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  VITE_APP_ENV: 'development' | 'staging' | 'production';
  VITE_API_BASE_URL: string;
}

// Form 관련 타입
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

// 차트 데이터 타입
export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartDataPoint[];
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    title?: string;
    showLegend?: boolean;
    colors?: string[];
  };
}