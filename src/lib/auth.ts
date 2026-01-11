import {
  signInAnonymously,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export async function signInAnonymouslyWithNickname(nickname: string): Promise<User> {
  const credential = await signInAnonymously(auth);

  // Update display name with nickname
  await updateProfile(credential.user, {
    displayName: nickname,
  });

  return credential.user;
}

export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signOut(): Promise<void> {
  await auth.signOut();
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
