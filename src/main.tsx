import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from './components/UI/ErrorBoundary';
import './styles/index.css';

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// 환경 변수 검증 (Mapbox는 선택사항)
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID'
];

const optionalEnvVars = [
  'VITE_MAPBOX_ACCESS_TOKEN' // 실제 지도 모드 사용 시에만 필요
];

const missingRequiredVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
const missingOptionalVars = optionalEnvVars.filter(varName => !import.meta.env[varName]);

if (missingRequiredVars.length > 0 && import.meta.env.PROD) {
  console.error('Missing required environment variables:', missingRequiredVars);
}

if (missingOptionalVars.length > 0) {
  console.info('Optional environment variables not set (픽토그램 모드만 사용 가능):', missingOptionalVars);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);