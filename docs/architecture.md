# BoomBim 시스템 아키텍처

## 📋 개요

BoomBim은 실시간 유동인구 데이터를 시각화하는 React 기반 웹 애플리케이션으로, Firebase를 백엔드로 활용하는 serverless 아키텍처를 채택합니다.

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Client Side   │    │   Firebase       │    │   External APIs     │
│   (React App)   │    │   Backend        │    │                     │
├─────────────────┤    ├──────────────────┤    ├─────────────────────┤
│ • Map Component │◄──►│ • Firestore DB   │◄──►│ • KT 유동인구 API   │
│ • UI Components │    │ • Cloud Functions│    │ • 공공데이터포털     │
│ • State Mgmt    │    │ • Hosting        │    │                     │
│ • React Query   │    │ • Auth (Future)  │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌──────────────────────┐
                    │   Development &      │
                    │   Deployment         │
                    ├──────────────────────┤
                    │ • GitHub Actions     │
                    │ • Firebase Deploy    │
                    │ • Vercel (Option)    │
                    └──────────────────────┘
```

## 🔧 기술 스택

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (빠른 개발 환경)
- **Styling**: Tailwind CSS
- **State Management**: React Query + Zustand
- **Maps**: Mapbox GL JS
- **Testing**: Vitest + React Testing Library

### Backend
- **Platform**: Firebase
- **Database**: Firestore
- **Functions**: Firebase Cloud Functions
- **Hosting**: Firebase Hosting
- **Authentication**: Firebase Auth (v2+)

### DevOps & Deployment
- **CI/CD**: GitHub Actions
- **Monitoring**: Firebase Analytics
- **Error Tracking**: Sentry (optional)

## 🔄 데이터 플로우

### 1. 데이터 수집 (Backend)
```
External API → Cloud Functions → Firestore
     │              │              │
     │              │              └─ population_data collection
     │              └─ 10분마다 스케줄링
     └─ KT 유동인구 API
```

### 2. 데이터 시각화 (Frontend)
```
Firestore → React Query → Zustand Store → Map Component
    │           │            │              │
    │           │            │              └─ Heatmap Layer
    │           │            └─ Global State  └─ Fire Icons
    │           └─ 캐싱 & 동기화              └─ Popups
    └─ Real-time data
```

## 📁 프로젝트 구조

```
boombim-web/
├── public/
│   ├── index.html
│   └── icons/
├── src/
│   ├── components/           # UI 컴포넌트
│   │   ├── Map/
│   │   ├── Modal/
│   │   └── UI/
│   ├── hooks/               # Custom hooks
│   ├── services/            # API & Firebase
│   ├── stores/              # State management
│   ├── types/               # TypeScript 타입
│   ├── utils/               # 유틸리티 함수
│   └── App.tsx
├── functions/               # Firebase Functions
│   ├── src/
│   │   ├── data-fetch.ts
│   │   └── index.ts
│   └── package.json
├── docs/                    # 프로젝트 문서
└── tests/                   # 테스트 파일
```

## 🔐 보안 고려사항

1. **API Key 보안**: Firebase Functions 환경변수로 관리
2. **CORS 설정**: 특정 도메인만 허용
3. **Rate Limiting**: Firebase Functions에서 요청 제한
4. **Data Validation**: 입력 데이터 검증 및 sanitization

## 📊 성능 최적화

1. **캐싱 전략**:
   - React Query: 10분 stale time
   - Browser caching: Static assets
   - CDN: Firebase Hosting

2. **번들 최적화**:
   - Code splitting (React.lazy)
   - Tree shaking
   - Image optimization

3. **지도 성능**:
   - 레이어 최적화
   - Viewport culling
   - Progressive loading

## 🚀 확장성 고려사항

1. **Horizontal Scaling**: Firebase serverless auto-scaling
2. **Data Partitioning**: 지역별 데이터 분할 저장
3. **Caching Layer**: Redis 추가 (필요시)
4. **Multi-region**: Firebase 다중 지역 배포

## 📈 모니터링 & 로깅

1. **Performance**: Firebase Performance Monitoring
2. **Analytics**: Firebase Analytics
3. **Error Tracking**: Console.error + Sentry
4. **Uptime**: Firebase 내장 모니터링