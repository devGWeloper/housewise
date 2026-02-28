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

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
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
  const inviteCode = generateInviteCode()
  const coupleRef = doc(collection(db, 'couples'))
  const coupleId = coupleRef.id

  await setDoc(coupleRef, {
    members: [uid],
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

  await updateDoc(doc(db, 'couples', coupleDoc.id), {
    members: arrayUnion(uid),
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
