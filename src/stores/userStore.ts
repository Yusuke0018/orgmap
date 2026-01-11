import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInAnonymouslyWithNickname, signOut, subscribeToAuthState } from '@/lib/auth';
import { validateChatworkToken } from '@/lib/chatwork';

interface UserState {
  userId: string | null;
  nickname: string | null;
  chatworkToken: string | null;
  chatworkTokenValid: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  setChatworkToken: (token: string | null) => Promise<void>;
  initAuth: () => () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      nickname: null,
      chatworkToken: null,
      chatworkTokenValid: false,
      isAuthenticated: false,
      isLoading: true,

      login: async (nickname: string) => {
        try {
          const user = await signInAnonymouslyWithNickname(nickname);
          set({
            userId: user.uid,
            nickname,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut();
          set({
            userId: null,
            nickname: null,
            chatworkToken: null,
            chatworkTokenValid: false,
            isAuthenticated: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          throw error;
        }
      },

      setChatworkToken: async (token: string | null) => {
        if (!token) {
          set({ chatworkToken: null, chatworkTokenValid: false });
          return;
        }

        const isValid = await validateChatworkToken(token);
        set({
          chatworkToken: token,
          chatworkTokenValid: isValid,
        });
      },

      initAuth: () => {
        // Subscribe to Firebase auth state
        const unsubscribe = subscribeToAuthState((user) => {
          if (user) {
            set({
              userId: user.uid,
              nickname: user.displayName || get().nickname,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Don't clear persisted data, just update loading state
            set({ isLoading: false });
          }
        });

        return unsubscribe;
      },
    }),
    {
      name: 'orgchart-user',
      partialize: (state) => ({
        nickname: state.nickname,
        chatworkToken: state.chatworkToken,
      }),
    }
  )
);
