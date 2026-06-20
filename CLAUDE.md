# CLAUDE.md

신혼부부용 **자산 관리** 앱 (Housewise). 거래 단위 가계부가 아니라 **"매달 한 번 스냅샷을 입력해 순자산을 추적"**하는 모델이 핵심 철학이다. 세세한 일별 거래 기록·일별 가용 금액 같은 기능은 의도적으로 두지 않는다.

## 명령어

```bash
npm run dev      # Vite 개발 서버
npm run build    # tsc -b && vite build
npm run lint     # eslint .
npm run preview  # 빌드 결과 미리보기
```

배포는 Firebase (`firebase.json`, `firestore.rules`, `firestore.indexes.json`).

## 기술 스택

React 19 + TypeScript + Vite · Tailwind CSS v4 + shadcn/ui (radix-ui) · Recharts · React Router v7 · Zustand · React Hook Form + Zod · Firebase (Auth + Firestore) · date-fns · sonner(토스트). 경로 별칭 `@/` → `src/`.

## 핵심 데이터 모델

Firestore 구조 (`couples/{coupleId}/` 하위 서브컬렉션):

- **`assets/{assetId}`** — 통장/투자/연금/부채. `assetType: 'deposit'|'stock'|'pension'|'debt'`, `owner: 'husband'|'wife'|'joint'`(명의), `purpose`(용도), `balance`(현재 잔액), `details`(은행명·만기일·연금유형·최초대출금·월상환액 등).
- **`monthlyRecords/{YYYY-MM}`** — 월 1문서. 그 달의 `income`/`expense` + 각 자산의 잔액 스냅샷(`entries[]`) + 계산된 `totalAssets`/`totalDebt`/`netWorth`. **월간 입력 화면이 쓰는 핵심 컬렉션.** 추이 차트·스파크라인은 모두 이 기록을 시계열로 사용한다.
- **`goals/{goalId}`** — 재무 목표. `track: 'networth'|'assets'|'manual'`, `targetAmount`, `currentAmount`(manual 전용), `targetDate`(선택), `emoji`.

`users/{uid}`(프로필·role·coupleId)와 `couples/{coupleId}`(members·inviteCode)는 루트 컬렉션. Firestore 규칙상 `couples/{coupleId}/{subcollection}/{docId}`는 인증된 사용자에게 read/write 허용 → 새 서브컬렉션 추가 시 규칙 수정 불필요.

## 화면 / 라우트

`src/pages/` + `src/App.tsx`의 라우트. 네비게이션 정의는 `src/components/layout/navigation.ts` 한 곳(데스크탑 Sidebar·모바일 MobileNav 공용).

- `/` **홈(Dashboard)** — 순자산, 명의별 자산, 월 수입/지출/저축, 재무 목표 요약, 순자산·현금흐름·부채 추이 차트, 자산 구성, 통장 용도, 대출 상환 현황, 만기 예정 예금
- `/monthly` **월간 입력** — 그 달 수입·지출 + 각 자산 잔액 입력(전월값 자동 prefill). 이번 달 저장 시 각 asset의 `balance`도 동기화
- `/assets` **자산** — 통장/투자/연금/부채 CRUD(`AssetForm`), 타입별 탭, 잔액 스파크라인
- `/goals` **목표** — 재무 목표 CRUD(`GoalForm`), 진행률 + 추세 기반 달성 시점 예측
- `/settings`, `/login`, `/onboarding`, `/setup`

## 코드 컨벤션

- **상태/데이터 훅**: `src/hooks/use*.ts`가 `onSnapshot` 실시간 구독 + CRUD를 캡슐화한다(`useAssets`, `useMonthlyRecords`, `useGoals`, `useAuth`). 컬렉션 접근은 항상 `profile.coupleId` 기준. 정렬은 가능하면 클라이언트에서 처리해 복합 인덱스를 피한다.
- **파생 계산은 페이지/`lib`에서**: 훅은 원시 데이터+CRUD만 제공하고, 합계·진행률·예측 같은 파생값은 페이지에서 계산하거나 `src/lib/`의 순수 함수로 뺀다 (예: `lib/goals.ts`의 `computeGoalProgress`).
- **금액 표시**: `src/lib/format.ts` — `formatCurrency`(₩), `formatAxisAmount`(차트 축 '억/천만/백만/만'), 월 헬퍼(`getCurrentMonth`/`getMonthLabel`/`getPrevMonth`/`getNextMonth`). 월은 항상 `'YYYY-MM'` 문자열.
- **금액 입력**: 콤마 표시 + 숫자만 파싱하는 패턴(`MonthlyEntry`/`GoalForm`의 `AmountInput`, `parseAmount`).
- **명의/타입 라벨·색상**: `src/types/index.ts`의 `ASSET_OWNER_LABELS`/`ASSET_OWNER_COLORS`/`ASSET_TYPE_LABELS`/`GOAL_TRACK_LABELS` 등 상수를 단일 출처로 사용. `OwnerBadge` 컴포넌트로 명의 뱃지 통일.
- **UI**: shadcn/ui 프리미티브(`src/components/ui/`)만 사용. 카드 기반 레이아웃, 모바일 우선(하단 MobileNav + 데스크탑 Sidebar는 `md:` 기준 분기).
- 라우트 컴포넌트는 `App.tsx`에서 `lazy` import. 새 페이지 추가 시 ①페이지 작성 ②`App.tsx` lazy+Route ③`navigation.ts`에 NavItem 추가, 세 곳을 함께 수정한다.

## 기능 추가 시 주의

- 거래 단위 가계부/일별 기능으로 회귀하지 말 것 — 월별 스냅샷 모델을 유지한다.
- 시계열이 필요한 기능은 `monthlyRecords`를 재사용한다(별도 기록 컬렉션을 늘리지 않음).
