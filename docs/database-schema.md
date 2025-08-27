# BoomBim 데이터베이스 스키마

## 📋 개요

Firestore를 사용한 NoSQL 데이터베이스 설계로, 실시간 유동인구 데이터와 지역 정보를 효율적으로 저장하고 조회할 수 있도록 구성합니다.

## 🗄️ Collection 구조

```
boombim-firestore/
├── population_data/          # 실시간 유동인구 데이터
│   ├── {timestamp}/
│   └── latest/              # 최신 데이터 별도 저장
├── regions/                 # 지역 기본 정보
│   ├── {regionId}/
├── historical_data/         # 과거 데이터 (향후 확장)
│   ├── {regionId_date}/
└── system/                  # 시스템 설정
    ├── config/
    └── api_status/
```

## 📊 Collection 상세 스키마

### 1. `population_data` Collection

실시간 유동인구 데이터를 저장합니다.

```typescript
interface PopulationDataDocument {
  // Document ID: ISO timestamp (2024-01-20T10:30:00Z)
  timestamp: Timestamp;
  dataSource: string;           // "kt_api" | "seoul_api"
  totalRegions: number;
  processingTimeMs: number;
  
  regions: {
    [regionId: string]: {
      id: string;
      name: string;
      coordinates: {
        lat: number;
        lng: number;
      };
      population: {
        current: number;        // 현재 유동인구
        baseline: number;       // 평상시 기준값
        changeRate: number;     // 변화율 (-1.0 ~ 1.0)
        status: 'low' | 'normal' | 'high' | 'critical';
        confidence: number;     // 데이터 신뢰도 (0-1)
      };
      metadata: {
        category: string;       // "transport_hub" | "commercial" | "residential"
        lastUpdated: Timestamp;
        dataQuality: 'good' | 'fair' | 'poor';
      };
    };
  };
  
  // 메타데이터
  metadata: {
    apiVersion: string;
    processingVersion: string;
    errorCount: number;
    successRate: number;
  };
}
```

### 2. `regions` Collection

지역별 기본 정보와 메타데이터를 저장합니다.

```typescript
interface RegionDocument {
  // Document ID: kebab-case region identifier (gangnam-station)
  id: string;
  name: string;
  nameEng: string;
  description: string;
  
  coordinates: {
    lat: number;
    lng: number;
    accuracy: number;        // GPS 정확도 (미터)
  };
  
  boundaries: Array<{
    lat: number;
    lng: number;
  }>;                        // 지역 경계 좌표들
  
  category: string;          // 지역 분류
  subcategory?: string;      // 세부 분류
  
  // 기본 통계
  baselineStats: {
    averagePopulation: number;
    peakHours: number[];     // 0-23 시간대
    quietHours: number[];
    weekdayMultiplier: number;
    weekendMultiplier: number;
  };
  
  // 주변 정보
  nearbyPlaces: Array<{
    name: string;
    type: 'subway' | 'bus' | 'cafe' | 'restaurant' | 'shopping' | 'park';
    distance: number;        // 미터 단위
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  
  // 관리 정보
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    version: string;
    dataSource: string[];    // 해당 지역을 커버하는 데이터 소스들
    isActive: boolean;       // 활성 상태
    priority: number;        // 우선순위 (1-10)
  };
}
```

### 3. `historical_data` Collection (향후 확장)

과거 유동인구 데이터를 일별로 집계하여 저장합니다.

```typescript
interface HistoricalDataDocument {
  // Document ID: {regionId}_{YYYY-MM-DD} (gangnam-station_2024-01-20)
  regionId: string;
  date: string;              // YYYY-MM-DD
  
  hourlyData: Array<{
    hour: number;            // 0-23
    population: number;
    changeRate: number;
    dataPoints: number;      // 해당 시간대 데이터 포인트 수
    confidence: number;
  }>;
  
  dailySummary: {
    minPopulation: number;
    maxPopulation: number;
    averagePopulation: number;
    peakHour: number;
    quietHour: number;
    totalDataPoints: number;
    averageChangeRate: number;
  };
  
  weatherData?: {
    condition: string;       // 날씨 상태
    temperature: number;     // 기온
    rainfall: number;        // 강수량
  };
  
  events?: Array<{
    name: string;
    type: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  
  metadata: {
    createdAt: Timestamp;
    dataQuality: 'good' | 'fair' | 'poor';
    completeness: number;    // 0-1, 해당일 데이터 완성도
  };
}
```

### 4. `system` Collection

시스템 설정 및 상태 정보를 저장합니다.

```typescript
// Document ID: "config"
interface SystemConfigDocument {
  api: {
    refreshInterval: number;     // 밀리초
    timeoutMs: number;
    retryCount: number;
    batchSize: number;
  };
  
  thresholds: {
    lowPopulation: number;       // 하위 임계값
    highPopulation: number;      // 상위 임계값
    criticalPopulation: number;  // 임계 임계값
    changeRateHigh: number;      // 높은 변화율 임계값
  };
  
  features: {
    fireIconsEnabled: boolean;
    historicalDataEnabled: boolean;
    weatherIntegration: boolean;
    realtimeUpdates: boolean;
  };
  
  maintenance: {
    lastBackup: Timestamp;
    nextScheduledMaintenance: Timestamp;
    version: string;
  };
}

// Document ID: "api_status"
interface ApiStatusDocument {
  lastSuccessfulFetch: Timestamp;
  lastFailedFetch?: Timestamp;
  consecutiveFailures: number;
  
  sources: {
    [sourceName: string]: {
      status: 'active' | 'inactive' | 'error';
      lastResponse: Timestamp;
      errorMessage?: string;
      responseTimeMs: number;
      successRate24h: number;   // 24시간 성공률
    };
  };
  
  metrics: {
    totalRequests24h: number;
    successfulRequests24h: number;
    averageResponseTime: number;
    peakUsage: Timestamp;
  };
}
```

## 🔍 인덱스 설계

### Composite Indexes

```javascript
// Firestore 인덱스 설정
const indexes = [
  {
    collectionGroup: 'population_data',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'timestamp', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'regions',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'category', order: 'ASCENDING' },
      { fieldPath: 'metadata.priority', order: 'DESCENDING' }
    ]
  },
  {
    collectionGroup: 'historical_data',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'regionId', order: 'ASCENDING' },
      { fieldPath: 'date', order: 'DESCENDING' }
    ]
  }
];
```

### 단일 필드 인덱스

- `population_data.timestamp` (DESC)
- `regions.category` (ASC)
- `regions.metadata.isActive` (ASC)
- `historical_data.regionId` (ASC)
- `historical_data.date` (DESC)

## 🔐 보안 규칙

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 모든 사용자가 population_data 읽기 가능
    match /population_data/{document} {
      allow read: if true;
      allow write: if false; // Cloud Functions에서만 쓰기
    }
    
    // 지역 정보 읽기 전용
    match /regions/{document} {
      allow read: if true;
      allow write: if false;
    }
    
    // 과거 데이터 읽기 전용
    match /historical_data/{document} {
      allow read: if true;
      allow write: if false;
    }
    
    // 시스템 설정은 관리자만 접근
    match /system/{document} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

## 📈 데이터 최적화 전략

### 1. 데이터 파티셔닝

```typescript
// 날짜별 파티셔닝을 위한 헬퍼 함수
const getPartitionedCollectionPath = (date: Date): string => {
  const yearMonth = date.toISOString().substring(0, 7); // 2024-01
  return `historical_data_${yearMonth}`;
};

// 사용 예시
const collectionPath = getPartitionedCollectionPath(new Date());
const historicalData = db.collection(collectionPath);
```

### 2. 캐싱 전략

```typescript
// 최신 데이터 별도 저장으로 빠른 조회
const cacheLatestData = async (data: PopulationDataDocument) => {
  // 실시간 컬렉션에 저장
  await db.collection('population_data').doc(data.timestamp.toISOString()).set(data);
  
  // 캐시 컬렉션에도 저장 (latest 고정 ID)
  await db.collection('population_data').doc('latest').set({
    ...data,
    cachedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};
```

### 3. 배치 연산 최적화

```typescript
// Firestore 배치 쓰기
const batchUpdateRegions = async (regions: PopulationData[]) => {
  const batch = db.batch();
  const timestamp = admin.firestore.Timestamp.now();
  
  // 500개씩 청크로 나누어 처리 (Firestore 배치 제한)
  const chunks = chunk(regions, 500);
  
  for (const chunk of chunks) {
    const chunkBatch = db.batch();
    
    chunk.forEach(region => {
      const docRef = db.collection('population_data')
        .doc(timestamp.toISOString())
        .collection('regions')
        .doc(region.id);
        
      chunkBatch.set(docRef, region);
    });
    
    await chunkBatch.commit();
  }
};
```

## 🧪 데이터 검증

```typescript
// Firestore 트리거로 데이터 검증
export const validatePopulationData = functions.firestore
  .document('population_data/{timestamp}')
  .onCreate(async (snap, context) => {
    const data = snap.data() as PopulationDataDocument;
    
    // 데이터 무결성 검사
    const validationErrors = [];
    
    if (!data.timestamp || data.timestamp > admin.firestore.Timestamp.now()) {
      validationErrors.push('Invalid timestamp');
    }
    
    if (!data.regions || Object.keys(data.regions).length === 0) {
      validationErrors.push('No region data found');
    }
    
    // 각 지역 데이터 검증
    Object.values(data.regions).forEach((region, index) => {
      if (region.population.current < 0) {
        validationErrors.push(`Invalid population for region ${region.id}`);
      }
      
      if (Math.abs(region.population.changeRate) > 2) {
        validationErrors.push(`Suspicious change rate for region ${region.id}`);
      }
    });
    
    if (validationErrors.length > 0) {
      console.error('Data validation failed:', validationErrors);
      
      // 에러 로그 저장
      await db.collection('system').doc('validation_errors').collection('errors').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        documentId: context.params.timestamp,
        errors: validationErrors
      });
    }
  });
```

## 📊 쿼리 패턴

### 자주 사용되는 쿼리들

```typescript
// 1. 최신 유동인구 데이터 조회
const getLatestPopulationData = async (): Promise<PopulationDataDocument> => {
  const snapshot = await db
    .collection('population_data')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();
    
  return snapshot.docs[0].data() as PopulationDataDocument;
};

// 2. 특정 지역의 상세 정보 조회
const getRegionDetails = async (regionId: string): Promise<RegionDocument> => {
  const doc = await db.collection('regions').doc(regionId).get();
  return doc.data() as RegionDocument;
};

// 3. 카테고리별 인기 지역 조회
const getPopularRegionsByCategory = async (category: string) => {
  return db
    .collection('regions')
    .where('category', '==', category)
    .where('metadata.isActive', '==', true)
    .orderBy('metadata.priority', 'desc')
    .limit(10)
    .get();
};

// 4. 실시간 고인구 밀도 지역 조회
const getHighDensityRegions = async (threshold: number) => {
  const latestData = await getLatestPopulationData();
  
  const highDensityRegions = Object.values(latestData.regions)
    .filter(region => region.population.current > threshold)
    .sort((a, b) => b.population.current - a.population.current);
    
  return highDensityRegions;
};
```

## 🔄 데이터 마이그레이션

```typescript
// 스키마 변경 시 마이그레이션 스크립트
const migratePopulationDataSchema = async () => {
  const batch = db.batch();
  
  const snapshot = await db
    .collection('population_data')
    .where('metadata.version', '<', '2.0')
    .get();
    
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    
    // 새로운 필드 추가
    const updatedData = {
      ...data,
      metadata: {
        ...data.metadata,
        version: '2.0',
        migrationDate: admin.firestore.FieldValue.serverTimestamp()
      }
    };
    
    batch.update(doc.ref, updatedData);
  });
  
  await batch.commit();
  console.log(`Migrated ${snapshot.docs.length} documents`);
};
```