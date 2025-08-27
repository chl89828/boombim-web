# BoomBim 테스팅 전략

## 📋 개요

BoomBim 프로젝트의 품질 보장을 위한 포괄적인 테스팅 전략으로, 단위 테스트부터 E2E 테스트까지 체계적으로 구성합니다.

## 🏗️ 테스트 피라미드

```
           /\
          /  \
         / E2E \ (적음, 고비용)
        /______\
       /        \
      / 통합테스트 \ (중간)
     /____________\
    /              \
   /   단위테스트   \ (많음, 저비용)
  /__________________\
```

### 테스트 비율 목표
- **단위 테스트**: 70% (빠르고 저렴)
- **통합 테스트**: 20% (컴포넌트 간 상호작용)
- **E2E 테스트**: 10% (사용자 시나리오)

## 🧪 테스트 도구 스택

### Frontend Testing
- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **E2E**: Playwright
- **Coverage**: c8 (built into Vitest)

### Backend Testing
- **Firebase Functions**: Firebase Test SDK
- **API Testing**: Supertest
- **Database**: Firebase Emulator Suite

## 📁 테스트 구조

```
tests/
├── unit/                    # 단위 테스트
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── integration/             # 통합 테스트
│   ├── api/
│   ├── database/
│   └── components/
├── e2e/                     # E2E 테스트
│   ├── user-flows/
│   ├── accessibility/
│   └── performance/
├── mocks/                   # Mock 데이터
│   ├── api/
│   ├── firebase/
│   └── fixtures/
└── setup/                   # 테스트 설정
    ├── vitest.config.ts
    ├── playwright.config.ts
    └── test-utils.tsx
```

## 🔬 단위 테스트 전략

### 1. 컴포넌트 테스트

```typescript
// tests/unit/components/MapView.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MapView } from '@/components/Map/MapView';
import { createTestWrapper } from '../../setup/test-utils';

// Mock Mapbox GL
vi.mock('mapbox-gl', () => ({
  Map: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    addLayer: vi.fn(),
    addSource: vi.fn(),
    getSource: vi.fn(),
    remove: vi.fn(),
  })),
}));

describe('MapView', () => {
  const mockProps = {
    data: [
      {
        id: 'gangnam-station',
        name: '강남역',
        coordinates: { lat: 37.497952, lng: 127.027619 },
        population: {
          current: 8543,
          baseline: 6200,
          changeRate: 0.378,
          status: 'high' as const,
          confidence: 0.95
        }
      }
    ],
    onRegionClick: vi.fn(),
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders map container', () => {
    render(<MapView {...mockProps} />, { wrapper: createTestWrapper() });
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(
      <MapView {...mockProps} isLoading={true} />, 
      { wrapper: createTestWrapper() }
    );
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('calls onRegionClick when region is selected', async () => {
    render(<MapView {...mockProps} />, { wrapper: createTestWrapper() });
    
    // Mapbox 클릭 이벤트 시뮬레이션
    const mapContainer = screen.getByTestId('map-container');
    fireEvent.click(mapContainer);
    
    await waitFor(() => {
      expect(mockProps.onRegionClick).toHaveBeenCalledWith('gangnam-station');
    });
  });

  it('updates heatmap when data changes', () => {
    const { rerender } = render(<MapView {...mockProps} />, { 
      wrapper: createTestWrapper() 
    });
    
    const newData = [...mockProps.data, {
      id: 'hongdae',
      name: '홍대입구',
      coordinates: { lat: 37.557527, lng: 126.925596 },
      population: {
        current: 12450,
        baseline: 9000,
        changeRate: 0.383,
        status: 'critical' as const,
        confidence: 0.88
      }
    }];

    rerender(<MapView {...mockProps} data={newData} />);
    
    // Mapbox addSource/addLayer 호출 확인
    expect(vi.mocked(mockMapInstance.addSource)).toHaveBeenCalledTimes(2);
  });
});
```

### 2. Hook 테스트

```typescript
// tests/unit/hooks/usePopulationData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePopulationData } from '@/hooks/usePopulationData';
import { mockPopulationData } from '../../mocks/fixtures/population-data';

// Mock Firebase
vi.mock('@/services/firebase', () => ({
  getPopulationData: vi.fn()
}));

describe('usePopulationData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('returns data when fetch is successful', async () => {
    vi.mocked(getPopulationData).mockResolvedValue(mockPopulationData);

    const { result } = renderHook(() => usePopulationData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPopulationData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles error states correctly', async () => {
    const errorMessage = 'Failed to fetch data';
    vi.mocked(getPopulationData).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePopulationData(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.data).toBeUndefined();
  });

  it('refetches data at specified interval', async () => {
    vi.mocked(getPopulationData).mockResolvedValue(mockPopulationData);
    vi.useFakeTimers();

    renderHook(() => usePopulationData({ refreshInterval: 5000 }), { wrapper });

    // 초기 호출
    await waitFor(() => {
      expect(getPopulationData).toHaveBeenCalledTimes(1);
    });

    // 5초 후 재호출
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(getPopulationData).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });
});
```

### 3. 서비스/유틸리티 테스트

```typescript
// tests/unit/services/firebase.test.ts
import { 
  getPopulationData, 
  getRegionDetails, 
  calculateChangeRate 
} from '@/services/firebase';
import { mockFirestore } from '../../mocks/firebase';

vi.mock('firebase/firestore', () => mockFirestore);

describe('Firebase Service', () => {
  describe('getPopulationData', () => {
    it('fetches latest population data', async () => {
      const mockData = { regions: { 'test-region': mockPopulationData } };
      mockFirestore.collection.mockReturnValue({
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          empty: false,
          docs: [{ data: () => mockData }]
        })
      });

      const result = await getPopulationData();
      
      expect(result).toEqual(Object.values(mockData.regions));
      expect(mockFirestore.collection).toHaveBeenCalledWith('population_data');
    });

    it('throws error when no data available', async () => {
      mockFirestore.collection.mockReturnValue({
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ empty: true })
      });

      await expect(getPopulationData()).rejects.toThrow('No population data available');
    });
  });

  describe('calculateChangeRate', () => {
    it('calculates positive change rate correctly', () => {
      const current = 1000;
      const baseline = 800;
      const expected = 0.25; // (1000 - 800) / 800

      expect(calculateChangeRate(current, baseline)).toBe(expected);
    });

    it('calculates negative change rate correctly', () => {
      const current = 600;
      const baseline = 800;
      const expected = -0.25; // (600 - 800) / 800

      expect(calculateChangeRate(current, baseline)).toBe(expected);
    });

    it('handles zero baseline gracefully', () => {
      expect(calculateChangeRate(100, 0)).toBe(0);
    });
  });
});
```

## 🔗 통합 테스트 전략

### 1. API 통합 테스트

```typescript
// tests/integration/api/population-api.test.ts
import request from 'supertest';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

describe('Population API Integration', () => {
  let app: any;
  let db: FirebaseFirestore.Firestore;

  beforeAll(async () => {
    // Firebase Emulator 설정
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    
    app = await import('../../../functions/src/index');
    db = getFirestore();
  });

  beforeEach(async () => {
    // 테스트 데이터 설정
    await db.collection('population_data').doc('test-timestamp').set({
      timestamp: new Date(),
      regions: {
        'test-region': {
          id: 'test-region',
          name: '테스트 지역',
          coordinates: { lat: 37.5, lng: 127.0 },
          population: {
            current: 1000,
            baseline: 800,
            changeRate: 0.25,
            status: 'normal'
          }
        }
      }
    });
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await db.recursiveDelete(db.collection('population_data'));
  });

  it('GET /api/population-data returns current data', async () => {
    const response = await request(app)
      .get('/api/population-data')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        regions: expect.arrayContaining([
          expect.objectContaining({
            id: 'test-region',
            name: '테스트 지역'
          })
        ])
      })
    });
  });

  it('GET /api/regions/{id} returns region details', async () => {
    await db.collection('regions').doc('test-region').set({
      id: 'test-region',
      name: '테스트 지역',
      description: '테스트용 지역입니다'
    });

    const response = await request(app)
      .get('/api/regions/test-region')
      .expect(200);

    expect(response.body.data.region.name).toBe('테스트 지역');
  });
});
```

### 2. 컴포넌트 통합 테스트

```typescript
// tests/integration/components/MapContainer.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapContainer } from '@/components/MapContainer';
import { createTestWrapper } from '../../setup/test-utils';
import { server } from '../../mocks/server';

describe('MapContainer Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('displays population data on map after loading', async () => {
    const user = userEvent.setup();
    
    render(<MapContainer />, { wrapper: createTestWrapper() });

    // 로딩 상태 확인
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // 데이터 로드 후 맵 표시 확인
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('opens modal when region is clicked', async () => {
    const user = userEvent.setup();
    
    render(<MapContainer />, { wrapper: createTestWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // 지역 클릭
    const region = screen.getByTestId('region-gangnam-station');
    await user.click(region);

    // 모달 열림 확인
    await waitFor(() => {
      expect(screen.getByTestId('details-modal')).toBeInTheDocument();
    });

    expect(screen.getByText('강남역')).toBeInTheDocument();
  });
});
```

## 🌐 E2E 테스트 전략

### Playwright 설정

```typescript
// tests/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 사용자 플로우 테스트

```typescript
// tests/e2e/user-flows/main-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Main User Flow', () => {
  test('user can view population data and interact with map', async ({ page }) => {
    await page.goto('/');

    // 1. 페이지 로드 확인
    await expect(page).toHaveTitle(/BoomBim/);
    await expect(page.getByTestId('map-container')).toBeVisible();

    // 2. 로딩 완료 대기
    await expect(page.getByTestId('loading-spinner')).toBeHidden();

    // 3. 지도에서 고인구 밀도 지역 확인
    const fireIcon = page.getByTestId('fire-icon').first();
    await expect(fireIcon).toBeVisible();

    // 4. 지역 클릭하여 상세 정보 보기
    await fireIcon.click();
    
    await expect(page.getByTestId('details-modal')).toBeVisible();
    await expect(page.getByText('평소보다')).toBeVisible(); // 변화율 텍스트

    // 5. 모달 닫기
    await page.getByTestId('close-modal-button').click();
    await expect(page.getByTestId('details-modal')).toBeHidden();

    // 6. 지도 줌 인/아웃 테스트
    await page.getByTestId('zoom-in-button').click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('zoom-out-button').click();
    await page.waitForTimeout(500);

    // 7. 새로고침 버튼 테스트
    await page.getByTestId('refresh-button').click();
    await expect(page.getByTestId('loading-spinner')).toBeVisible();
    await expect(page.getByTestId('loading-spinner')).toBeHidden();
  });

  test('user can search for specific regions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 검색 기능 테스트 (향후 구현)
    const searchInput = page.getByTestId('region-search-input');
    await searchInput.fill('강남역');
    await searchInput.press('Enter');

    await expect(page.getByText('강남역')).toBeVisible();
  });
});
```

### 접근성 테스트

```typescript
// tests/e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('main page should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('modal should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 모달 열기
    await page.getByTestId('fire-icon').first().click();
    await expect(page.getByTestId('details-modal')).toBeVisible();

    // 접근성 검사
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="details-modal"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);

    // 키보드 네비게이션 테스트
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('close-modal-button')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('details-modal')).toBeHidden();
  });
});
```

### 성능 테스트

```typescript
// tests/e2e/performance/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3초 이내 로드

    // Core Web Vitals 측정
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {
            lcp: 0,
            fid: 0,
            cls: 0
          };

          entries.forEach((entry) => {
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            } else if (entry.name === 'first-input-delay') {
              vitals.fid = entry.duration;
            } else if (entry.name === 'cumulative-layout-shift') {
              vitals.cls = entry.value;
            }
          });

          resolve(vitals);
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });

    // Core Web Vitals 임계값 확인
    expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(vitals.fid).toBeLessThan(100);  // FID < 100ms
    expect(vitals.cls).toBeLessThan(0.1);  // CLS < 0.1
  });

  test('map rendering performance', async ({ page }) => {
    await page.goto('/');
    
    // 지도 렌더링 시간 측정
    const renderTime = await page.evaluate(() => {
      const startTime = performance.now();
      
      return new Promise((resolve) => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              const mapCanvas = document.querySelector('.mapboxgl-canvas');
              if (mapCanvas) {
                observer.disconnect();
                resolve(performance.now() - startTime);
              }
            }
          });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });

    expect(renderTime).toBeLessThan(1000); // 1초 이내 지도 렌더링
  });
});
```

## 📊 테스트 커버리지 목표

```json
// vitest.config.ts coverage 설정
{
  "coverage": {
    "provider": "c8",
    "reporter": ["text", "html", "lcov"],
    "reportsDirectory": "./coverage",
    "thresholds": {
      "global": {
        "branches": 80,
        "functions": 85,
        "lines": 90,
        "statements": 90
      }
    },
    "exclude": [
      "**/*.d.ts",
      "**/*.config.*",
      "**/node_modules/**",
      "**/tests/**",
      "**/coverage/**"
    ]
  }
}
```

## 🚀 CI/CD 파이프라인 통합

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🔧 테스트 유틸리티

```typescript
// tests/setup/test-utils.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

export const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: createTestWrapper() });
};

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
      pass,
    };
  },
});
```

이제 BoomBim 프로젝트의 설계가 완료되었습니다! 

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Analyze PRD and todos documents", "status": "completed", "activeForm": "Analyzed PRD and todos documents"}, {"content": "Design system architecture and technical specifications", "status": "completed", "activeForm": "Designed system architecture and technical specifications"}, {"content": "Generate development documentation suite", "status": "completed", "activeForm": "Generated development documentation suite"}, {"content": "Create project structure and setup guides", "status": "completed", "activeForm": "Created project structure and setup guides"}]