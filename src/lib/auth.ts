import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { UserRole } from '@/types'

const googleProvider = new GoogleAuthProvider()

// Firebase 인증 에러 코드를 사용자용 한국어 메시지로 변환한다.
// (code가 없는 일반 Error는 그 메시지를 그대로 노출 — 온보딩의 커스텀 에러 등)
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일이에요. 로그인해주세요.'
    case 'auth/invalid-email':
      return '이메일 형식이 올바르지 않아요.'
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 해요.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일 또는 비밀번호가 올바르지 않아요.'
    case 'auth/too-many-requests':
      return '시도 횟수가 많아요. 잠시 후 다시 시도해주세요.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '로그인 창이 닫혔어요. 다시 시도해주세요.'
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해주세요.'
    default:
      return err instanceof Error ? err.message : '오류가 발생했습니다.'
  }
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 중복되지 않는 초대 코드를 발급한다 (엉뚱한 커플 참여 방지).
async function generateUniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode()
    const snap = await getDocs(query(collection(db, 'couples'), where('inviteCode', '==', code)))
    if (snap.empty) return code
  }
  return generateInviteCode()
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  return cred.user
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  return cred.user
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function createCouple(uid: string, displayName: string, role: UserRole) {
  const inviteCode = await generateUniqueInviteCode()
  const coupleRef = doc(collection(db, 'couples'))
  const coupleId = coupleRef.id

  await setDoc(coupleRef, {
    members: [uid],
    memberRoles: { [uid]: role },
    inviteCode,
    createdAt: serverTimestamp(),
  })

  await setDoc(doc(db, 'users', uid), {
    email: auth.currentUser?.email,
    displayName,
    role,
    coupleId,
    createdAt: serverTimestamp(),
  })

  return { coupleId, inviteCode }
}

export async function joinCouple(uid: string, displayName: string, role: UserRole, inviteCode: string) {
  const q = query(collection(db, 'couples'), where('inviteCode', '==', inviteCode))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    throw new Error('유효하지 않은 초대 코드입니다.')
  }

  const coupleDoc = snapshot.docs[0]
  const coupleData = coupleDoc.data()

  if (coupleData.members.length >= 2) {
    throw new Error('이미 2명이 연결된 커플입니다.')
  }

  if (coupleData.members.includes(uid)) {
    throw new Error('이미 연결된 계정입니다.')
  }

  // 배우자가 이미 같은 역할(남편/아내)을 선택했다면 막는다 — 명의 구분이 꼬이지 않게.
  const takenRoles = Object.values((coupleData.memberRoles ?? {}) as Record<string, UserRole>)
  if (takenRoles.includes(role)) {
    const taken = role === 'husband' ? '남편' : '아내'
    throw new Error(`배우자가 이미 '${taken}'(으)로 설정했어요. 다른 역할을 선택해주세요.`)
  }

  await updateDoc(doc(db, 'couples', coupleDoc.id), {
    members: arrayUnion(uid),
    [`memberRoles.${uid}`]: role,
  })

  await setDoc(doc(db, 'users', uid), {
    email: auth.currentUser?.email,
    displayName,
    role,
    coupleId: coupleDoc.id,
    createdAt: serverTimestamp(),
  })

  return coupleDoc.id
}

export async function checkUserProfile(uid: string) {
  const userDoc = await getDoc(doc(db, 'users', uid))
  return userDoc.exists() ? userDoc.data() : null
}
