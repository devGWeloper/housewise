# 우리 가계부

신혼부부를 위한 공유 가계부 웹앱입니다. 두 사람이 함께 수입/지출을 기록하고, 월별 재정 현황과 전체 자산을 한눈에 파악할 수 있습니다.

## 주요 기능

- **공유 가계부**: 부부 두 명이 초대 코드로 연결하여 실시간 데이터 공유
- **수입/지출 기록**: 날짜, 금액, 카테고리, 메모 입력 + 입력자 표시
- **대시보드**: 이번 달 재정 현황 + 전체 자산 현황 + 차트
- **예산 관리**: 월별/카테고리별 예산 설정 및 초과 경고
- **고정비 자동 등록**: 매월 반복되는 고정 지출 자동 등록
- **자산 관리**: 예금/적금, 주식/ETF, 연금, 부채 관리
- **모바일 반응형**: 스마트폰에서도 편하게 입력 가능

## 기술 스택

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Recharts (차트)
- Zustand (상태 관리)
- Firebase (Authentication, Firestore, Hosting)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트를 생성합니다.
2. **Authentication** 탭에서 이메일/비밀번호 및 Google 로그인을 활성화합니다.
3. **Firestore Database**를 생성합니다.
4. 프로젝트 설정 > 일반 > 웹 앱 추가에서 Firebase 설정 값을 복사합니다.

### 3. 환경변수 설정

`.env.example`을 `.env`로 복사하고, Firebase 설정 값을 입력합니다:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Firestore 보안 규칙 배포

```bash
firebase deploy --only firestore:rules
```

### 5. 개발 서버 실행

```bash
npm run dev
```

### 6. 프로덕션 배포

```bash
npm run build
firebase deploy --only hosting
```

## 사용법

1. 회원가입 또는 Google 로그인
2. "새 커플 만들기"로 커플 계정 생성
3. 생성된 6자리 초대 코드를 파트너에게 전달
4. 파트너가 "초대 코드로 참여하기"로 연결
5. 함께 가계부 사용 시작!

## 프로젝트 구조

```
src/
├── components/
│   ├── layout/          # 레이아웃 (Sidebar, Header, MobileNav)
│   ├── ui/              # shadcn/ui 컴포넌트
│   └── ProtectedRoute.tsx
├── hooks/               # 커스텀 훅 (useTransactions, useBudget 등)
├── lib/                 # Firebase 설정, 인증, 유틸리티
├── pages/               # 페이지 컴포넌트
├── stores/              # Zustand 스토어
└── types/               # TypeScript 타입 정의
```
