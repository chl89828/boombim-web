# BoomBim API 설계

## 📋 개요

BoomBim의 백엔드 API는 Firebase Firestore를 데이터베이스로 하고, Cloud Functions를 통해 외부 API와 통신합니다.

## 🔗 API 엔드포인트

### 1. 유동인구 데이터 API

#### GET `/api/population-data`
실시간 유동인구 데이터를 조회합니다.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-20T10:30:00Z",
    "regions": [
      {
        "id": "gangnam-station",
        "name": "강남역",
        "coordinates": {
          "lat": 37.497952,
          "lng": 127.027619
        },
        "population": {
          "current": 8543,
          "baseline": 6200,
          "changeRate": 0.378,
          "status": "high"
        },
        "metadata": {
          "category": "transport_hub",
          "lastUpdated": "2024-01-20T10:20:00Z"
        }
      }
    ]
  },
  "meta": {
    "totalRegions": 150,
    "updateInterval": "10min",
    "dataSource": "kt_flow_api"
  }
}
```

**Query Parameters:**
- `region`: 특정 지역 필터링 (optional)
- `minPopulation`: 최소 유동인구 수 (optional)
- `status`: 상태 필터 ("low", "normal", "high") (optional)

### 2. 지역 상세 정보 API

#### GET `/api/regions/{regionId}`
특정 지역의 상세 정보를 조회합니다.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "region": {
      "id": "hongdae",
      "name": "홍대입구",
      "description": "젊음의 거리, 클럽과 카페가 밀집한 지역",
      "coordinates": {
        "lat": 37.557527,
        "lng": 126.925596
      },
      "population": {
        "current": 12450,
        "hourlyData": [
          {"hour": 9, "population": 3200},
          {"hour": 10, "population": 4500}
        ],
        "weeklyTrend": [
          {"day": "Mon", "avgPopulation": 8500},
          {"day": "Tue", "avgPopulation": 9200}
        ]
      },
      "hotspots": [
        {
          "name": "홍대 놀이터",
          "type": "entertainment",
          "distance": 50
        }
      ]
    }
  }
}
```

## 🔧 Firebase Functions

### 1. Data Fetcher Function

```typescript
// functions/src/data-fetch.ts
export const fetchPopulationData = functions
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule('every 10 minutes')
  .onRun(async (context) => {
    try {
      // KT API 호출
      const response = await ktApiClient.getPopulationData();
      
      // 데이터 변환 및 검증
      const processedData = processApiResponse(response);
      
      // Firestore에 저장
      await saveToFirestore(processedData);
      
      console.log('Data fetch completed successfully');
    } catch (error) {
      console.error('Data fetch failed:', error);
      throw error;
    }
  });
```

### 2. HTTP API Function

```typescript
// functions/src/api.ts
export const api = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  res.set('Access-Control-Allow-Origin', '*');
  
  const path = req.path;
  const method = req.method;
  
  try {
    switch (true) {
      case path === '/population-data' && method === 'GET':
        return await getPopulationData(req, res);
        
      case path.startsWith('/regions/') && method === 'GET':
        return await getRegionDetails(req, res);
        
      default:
        res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## 🗄️ 데이터베이스 스키마

### Firestore Collections

#### 1. `population_data` Collection
```javascript
{
  id: "2024-01-20T10:30:00Z", // timestamp as document ID
  timestamp: Timestamp,
  regions: Map<string, {
    id: string,
    name: string,
    coordinates: GeoPoint,
    current: number,
    baseline: number,
    changeRate: number,
    status: "low" | "normal" | "high"
  }>,
  metadata: {
    source: string,
    totalRegions: number,
    processingTime: number
  }
}
```

#### 2. `regions` Collection (참조 데이터)
```javascript
{
  id: "gangnam-station", // region ID
  name: string,
  nameEng: string,
  description: string,
  coordinates: GeoPoint,
  category: string,
  boundaries: Array<GeoPoint>, // 지역 경계
  hotspots: Array<{
    name: string,
    type: string,
    coordinates: GeoPoint
  }>,
  metadata: {
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
}
```

#### 3. `historical_data` Collection (향후 확장)
```javascript
{
  id: "{regionId}_{date}", // composite ID
  regionId: string,
  date: string, // YYYY-MM-DD
  hourlyData: Array<{
    hour: number,
    population: number,
    weather?: string
  }>,
  dailyStats: {
    min: number,
    max: number,
    average: number,
    peakHour: number
  }
}
```

## 🔐 외부 API 연동

### KT 유동인구 API

```typescript
interface KTApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

class KTApiClient {
  async getPopulationData(regions?: string[]): Promise<KTApiResponse> {
    const params = {
      key: this.apiKey,
      regions: regions?.join(','),
      format: 'json'
    };
    
    const response = await fetch(`${this.baseUrl}/population`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`KT API Error: ${response.status}`);
    }
    
    return response.json();
  }
}
```

## 📊 에러 처리 및 로깅

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "External API is temporarily unavailable",
    "details": "KT API returned 503 status",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

### 로깅 전략
```typescript
import { logger } from 'firebase-functions';

// 구조화된 로깅
logger.info('Data fetch started', {
  timestamp: new Date().toISOString(),
  regions: requestedRegions.length,
  source: 'kt_api'
});

logger.error('API call failed', {
  error: error.message,
  statusCode: error.statusCode,
  retryAttempt: attempt,
  endpoint: 'kt_population_api'
});
```

## 🚀 성능 최적화

1. **캐싱**: Firestore 쿼리 결과 10분간 캐싱
2. **배치 처리**: 여러 지역 데이터를 배치로 저장
3. **압축**: 응답 데이터 gzip 압축
4. **인덱싱**: timestamp, region ID 기반 복합 인덱스

## 📝 API 테스팅

```typescript
// functions/src/__tests__/api.test.ts
describe('Population API', () => {
  test('should return population data', async () => {
    const response = await request(app)
      .get('/api/population-data')
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.regions).toBeInstanceOf(Array);
  });
});
```