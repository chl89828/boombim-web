# 🔥 BoomBim - 서울시 인구 분포 대시보드

서울시 인구 데이터를 직관적인 픽토그램과 실시간 지도로 시각화하는 React 기반 웹 애플리케이션입니다.

## ✨ 주요 기능

- **🎨 픽토그램 지도**: 서울시 25개 구를 직관적인 타일로 표현 (기본 모드)
- **🗺️ 실제 지도 모드**: Mapbox 기반 상세 지도 뷰 (선택사항)
- **⚡ 모드 전환**: 픽토그램 ↔ 실제 지도 간편 토글
- **📊 인터랙티브 시각화**: 인구밀도 색상 코딩 및 호버 효과
- **💬 상세 정보 툴팁**: 구역별 인구 통계 및 변화율
- **📱 반응형 디자인**: 모바일/태블릿/데스크톱 최적화

## 🚀 기술 스택

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (커스텀 디자인 시스템)
- **픽토그램 지도** (커스텀 SVG/CSS 기반 시각화)
- **Mapbox GL JS** (선택적, 실제 지도 모드용)
- **React Query** + **Zustand** (데이터 및 상태 관리)
- **Framer Motion** (애니메이션)

### Backend
- **Firebase** (Firestore, Cloud Functions, Hosting)
- **KT 유동인구 API** (데이터 소스)

### Testing & Quality
- **Vitest** + **React Testing Library**
- **ESLint** + **Prettier**

## 📋 시작하기

### 1. 사전 요구사항

- **Node.js** 18.0.0 이상
- **npm** 8.0.0 이상
- **Mapbox** 계정 및 Access Token
- **Firebase** 프로젝트

### 2. 설치

```bash
# 저장소 클론
git clone https://github.com/chl89828/boombim-web.git
cd boombim-web

# 의존성 설치
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 실제 환경 변수 값을 입력:

```bash
# .env.local 파일 생성
touch .env.local
```

`.env.local` 파일 내용 (실제 값으로 교체 필요):

```env
# Mapbox Access Token (선택사항 - 픽토그램 모드는 이 설정 없이도 작동)
VITE_MAPBOX_ACCESS_TOKEN=실제_Mapbox_토큰

# Firebase 설정 (실제 Firebase 프로젝트 정보로 교체 필요)
VITE_FIREBASE_API_KEY=실제_Firebase_API_키
VITE_FIREBASE_AUTH_DOMAIN=실제_프로젝트.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=실제_프로젝트_ID
VITE_FIREBASE_STORAGE_BUCKET=실제_프로젝트.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=실제_메신저_ID
VITE_FIREBASE_APP_ID=실제_앱_ID

# 개발 환경 설정
NODE_ENV=development
VITE_APP_ENV=development
```

> **보안 주의**: 실제 API 키와 토큰을 사용하고, 이 파일을 절대 git에 커밋하지 마세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 🛠️ 사용 가능한 스크립트

```bash
# 개발 서버 시작
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 테스트 실행
npm run test

# 테스트 UI
npm run test:ui

# 테스트 커버리지
npm run test:coverage
```

## 🏗️ 프로젝트 구조

```
src/
├── components/           # React 컴포넌트
│   ├── Map/             # 지도 관련 컴포넌트
│   │   ├── MapView.tsx  # 메인 지도 컴포넌트
│   │   ├── HeatmapLayer.tsx # 히트맵 레이어
│   │   ├── FireIcons.tsx    # 핫스팟 아이콘
│   │   └── MapControls.tsx  # 지도 컨트롤
│   ├── Modal/           # 모달 컴포넌트
│   │   ├── DetailsModal.tsx # 상세 정보 모달
│   │   ├── PopulationStats.tsx # 인구 통계
│   │   └── HourlyChart.tsx     # 시간대별 차트
│   └── UI/              # 기본 UI 컴포넌트
│       ├── LoadingSpinner.tsx
│       ├── Header.tsx
│       └── ErrorBoundary.tsx
├── hooks/               # 커스텀 훅
│   ├── usePopulationData.ts # 인구 데이터 관리
│   ├── useMapbox.ts         # Mapbox 지도 관리
│   └── useRegionDetails.ts  # 지역 상세 정보
├── services/            # 외부 서비스 연동
│   ├── firebase.ts      # Firebase 설정
│   └── population.ts    # 인구 데이터 서비스
├── stores/              # 상태 관리
│   └── appStore.ts      # Zustand 메인 스토어
├── types/               # TypeScript 타입 정의
│   └── index.ts         # 모든 타입 정의
└── styles/              # 스타일
    └── index.css        # Tailwind + 커스텀 CSS
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary Orange**: `#FF4C29` (메인 브랜드)
- **Primary Yellow**: `#F2A21F` (강조)  
- **Primary Blue**: `#3366FF` (액센트)

### 히트맵 색상
- **낮음**: `#3B82F6` (파랑)
- **보통**: `#F59E0B` (노랑)
- **높음**: `#EF4444` (빨강)
- **매우높음**: `#DC2626` (진한 빨강)

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# 테스트 시청 모드
npm run test -- --watch

# 커버리지 리포트
npm run test:coverage
```

## 📱 반응형 지원

- **모바일**: 320px ~ 768px
- **태블릿**: 768px ~ 1024px  
- **데스크톱**: 1024px 이상

## 🚀 배포

### Firebase Hosting

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init

# 빌드 및 배포
npm run build
firebase deploy
```

### Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel --prod
```

## 🔧 개발 도구 설정

### VS Code 확장 프로그램
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- TypeScript Importer

### VS Code 설정
`.vscode/settings.json` 파일이 포함되어 있어 일관된 개발 환경을 제공합니다.

## 📊 성능 최적화

- **코드 스플리팅**: React.lazy + Suspense
- **번들 최적화**: Vite의 트리 쉐이킹
- **이미지 최적화**: WebP 포맷 지원
- **캐싱 전략**: React Query 10분 캐시
- **지도 최적화**: Viewport culling, 레이어 관리

## 🛡️ 보안

- **환경 변수**: 민감한 정보 .env 파일 관리
- **API 키 보호**: Firebase Functions에서 서버사이드 처리
- **CORS 설정**: 특정 도메인만 허용
- **입력 검증**: TypeScript를 통한 타입 안전성

## 📄 라이센스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

- **개발자**: chl89828
- **이메일**: chl89828@naver.com
- **GitHub**: [https://github.com/chl89828/boombim-web](https://github.com/chl89828/boombim-web)

---

**🔥 BoomBim**으로 실시간 서울의 핫플레이스를 확인해보세요!