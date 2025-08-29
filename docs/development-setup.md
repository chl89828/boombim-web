# BoomBim 개발 환경 설정 가이드

## 📋 개발 환경 요구사항

### 필수 소프트웨어
- **Node.js**: v18.0.0 이상
- **npm**: v8.0.0 이상 (또는 yarn v1.22.0 이상)
- **Git**: v2.30.0 이상

### 권장 도구
- **VS Code**: 최신 버전
- **Firebase CLI**: v12.0.0 이상
- **Docker**: v20.0.0 이상 (선택사항)

## 🚀 프로젝트 설정

### 1. 저장소 클론 및 의존성 설치

```bash
# 저장소 클론
git clone https://github.com/chl89828/boombim-web.git
cd boombim-web

# 의존성 설치
npm install

# Firebase Functions 의존성 설치
cd functions
npm install
cd ..
```

### 2. 환경 변수 설정

```bash
# 루트 디렉토리에 .env.local 파일 생성
touch .env.local
```

`.env.local` 파일 내용:
```env
# Mapbox (선택사항 - 픽토그램 모드는 이 설정 없이도 작동)
VITE_MAPBOX_ACCESS_TOKEN=pk.ey...실제_토큰_입력

# Firebase (개발 환경 - 실제 값으로 교체 필요)
VITE_FIREBASE_API_KEY=실제_API_키
VITE_FIREBASE_AUTH_DOMAIN=실제_프로젝트.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=실제_프로젝트_ID
VITE_FIREBASE_STORAGE_BUCKET=실제_프로젝트.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=실제_sender_ID
VITE_FIREBASE_APP_ID=1:실제_ID:web:실제_앱_ID

# KT API (Firebase Functions에서 사용 - 실제 값으로 교체 필요)
FIREBASE_KT_API_KEY=실제_KT_API_키
FIREBASE_KT_API_URL=https://api.kt.com/population/v1

# 개발 환경 설정
NODE_ENV=development
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Firebase 프로젝트 설정

```bash
# Firebase CLI 설치 (전역)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 초기화
firebase init

# 선택 옵션:
# - Firestore: Configure security rules and indexes files
# - Functions: Configure and deploy Cloud Functions
# - Hosting: Configure and deploy Firebase Hosting sites
# - Storage: Configure and deploy Cloud Storage buckets

# Functions 환경 변수 설정 (실제 키로 교체 필요)
firebase functions:config:set kt.api_key="실제_KT_API_키"
firebase functions:config:set kt.api_url="https://api.kt.com/population/v1"
```

### 4. Mapbox 설정

1. [Mapbox](https://www.mapbox.com/)에서 계정 생성
2. Access Token 발급
3. `.env.local`에 토큰 추가

## 📁 프로젝트 구조 생성

### 디렉토리 구조

```bash
mkdir -p src/{components/{Map,Modal,UI},hooks,services,stores,types,utils,styles}
mkdir -p functions/src
mkdir -p public/icons
mkdir -p tests/{components,hooks,services}
mkdir -p docs
```

### 초기 파일 생성

```bash
# TypeScript 설정
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/stores/*": ["src/stores/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Vite 설정
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mapbox: ['mapbox-gl'],
          firebase: ['firebase/app', 'firebase/firestore']
        }
      }
    }
  }
})
EOF

# Tailwind 설정
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          orange: '#FF4C29',
          yellow: '#F2A21F',
          blue: '#3366FF'
        },
        heat: {
          low: '#3B82F6',
          medium: '#F59E0B',
          high: '#EF4444',
          critical: '#DC2626'
        }
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-fire': 'pulseFire 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        pulseFire: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' }
        }
      }
    },
  },
  plugins: [],
}
EOF
```

## 🛠️ 개발 도구 설정

### VS Code 확장 프로그램

`.vscode/extensions.json`:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code 설정

`.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### ESLint 설정

```bash
# ESLint 관련 패키지 설치
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
```

`.eslintrc.cjs`:
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
```

### Prettier 설정

`.prettierrc.json`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## 📦 패키지 설치

### 의존성 설치

```bash
# Core dependencies
npm install react react-dom react-router-dom

# State management & data fetching
npm install @tanstack/react-query zustand

# UI & Styling
npm install tailwindcss @headlessui/react framer-motion

# Maps
npm install mapbox-gl @types/mapbox-gl

# Firebase
npm install firebase

# Utilities
npm install clsx date-fns

# Development dependencies
npm install -D @types/react @types/react-dom @vitejs/plugin-react-swc vite typescript
npm install -D tailwindcss postcss autoprefixer
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Firebase Functions 의존성

```bash
cd functions
npm install firebase-functions firebase-admin

# Development dependencies
npm install -D typescript @types/node
```

## 🧪 테스트 환경 설정

### Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 테스트 설정 파일

```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

## 🔧 스크립트 설정

`package.json`에 추가할 scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "firebase:emulator": "firebase emulators:start",
    "firebase:deploy": "firebase deploy",
    "firebase:deploy:functions": "firebase deploy --only functions",
    "firebase:deploy:hosting": "firebase deploy --only hosting"
  }
}
```

## 🚀 개발 서버 실행

```bash
# 프론트엔드 개발 서버 실행
npm run dev

# Firebase 에뮬레이터 실행 (별도 터미널)
npm run firebase:emulator

# 테스트 실행
npm test
```

## 🌐 브라우저 설정

### 개발용 브라우저 확장 프로그램

1. **React Developer Tools**
2. **Redux DevTools** (상태 관리 디버깅)
3. **Firebase Extension** (Firebase 데이터 확인)

## 📈 성능 모니터링 도구

```bash
# Bundle Analyzer 설치
npm install -D rollup-plugin-visualizer

# 번들 분석 실행
npm run build && npx vite-bundle-analyzer dist/stats.html
```

## 🔍 디버깅 설정

### VS Code 디버그 설정

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true
    }
  ]
}
```

## ✅ 개발 환경 확인 체크리스트

- [ ] Node.js 18+ 설치 확인
- [ ] npm install 성공
- [ ] 환경 변수 설정 완료
- [ ] Firebase 프로젝트 연결
- [ ] Mapbox 토큰 설정
- [ ] 개발 서버 정상 실행 (localhost:3000)
- [ ] ESLint/Prettier 작동 확인
- [ ] 테스트 실행 성공
- [ ] VS Code 확장 프로그램 설치