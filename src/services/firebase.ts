import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import type { EnvironmentVariables } from '@/types';

// Firebase 설정 인터페이스
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// 환경 변수에서 Firebase 설정 가져오기
const getFirebaseConfig = (): FirebaseConfig => {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // 필수 환경 변수 검증
  const requiredFields: (keyof FirebaseConfig)[] = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
  ];
  
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missingFields
        .map(field => `VITE_FIREBASE_${field.toUpperCase()}`)
        .join(', ')}`
    );
  }

  return config;
};

// Firebase 앱 초기화
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

// 개발 환경에서 에뮬레이터 연결 (에뮬레이터가 실행 중일 때만)
if (import.meta.env.VITE_APP_ENV === 'development' && import.meta.env.VITE_USE_EMULATOR === 'true') {
  // Firestore 에뮬레이터
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Firestore emulator connected');
  } catch (e) {
    console.log('Firestore emulator connection skipped:', e.message);
  }
  
  // Auth 에뮬레이터
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('Auth emulator connected');
  } catch (e) {
    console.log('Auth emulator connection skipped:', e.message);
  }
}

// Firebase 앱 내보내기
export default app;