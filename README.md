# HouseWise

맞벌이 부부를 위한 **공동 자산 관리** 웹앱입니다. 한 달에 한 번 5분만 투자해 각 통장·자산·부채 잔액과 그 달의 수입/지출을 일괄 입력하면, 부부의 전체 자산 현황과 변화 추이를 한눈에 볼 수 있습니다.

## 주요 기능

- **부부 공동 관리**: 두 명이 초대 코드로 연결하여 실시간 데이터 공유 (명의: 남편/아내/공동)
- **월간 입력**: 매달 수입·지출 + 통장·자산·부채 잔액을 한 화면에서 일괄 입력 (직전 값 prefill)
- **대시보드**: 순자산 / 명의별 자산 / 이 달 수입·지출·저축 + 추이 차트(순자산·현금흐름·부채)
- **자산 관리**: 예금/적금, 주식/ETF, 연금, 부채를 용도·명의별로 관리
- **통장 용도**: 통장마다 용도(투자용, 공과금 등)를 지정해 한눈에 파악
- **초기 자산 등록**: 최초 시작 시 보유 자산을 빠르게 등록
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
firebase deploy --only hosting,firestore
```

## 사용법

1. 회원가입 또는 Google 로그인
2. "새 커플 만들기"로 커플 계정 생성 → 보유 자산 등록
3. 생성된 6자리 초대 코드를 파트너에게 전달
4. 파트너가 "초대 코드로 참여하기"로 연결
5. 매달 '월간 입력'으로 잔액만 갱신하면 끝!

## 프로젝트 구조

```
src/
├── components/
│   ├── layout/          # 레이아웃 (Sidebar, Header, MobileNav)
│   ├── ui/              # shadcn/ui 컴포넌트
│   ├── AssetForm.tsx    # 자산 등록/수정 폼 (공용)
│   ├── OwnerBadge.tsx   # 명의 배지 (공용)
│   └── ProtectedRoute.tsx
├── hooks/               # 커스텀 훅 (useAssets, useMonthlyRecords, useAuth)
├── lib/                 # Firebase 설정, 인증, 포맷 유틸리티
├── pages/               # 페이지 (Dashboard, MonthlyEntry, Assets, Setup 등)
├── stores/              # Zustand 스토어
└── types/               # TypeScript 타입 정의
```
