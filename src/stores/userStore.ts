import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  userId: string | null;
  nickname: string | null;
  chatworkToken: string | null;
  isAuthenticated: boolean;
  setUser: (userId: string, nickname: string) => void;
  setChatworkToken: (token: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      nickname: null,
      chatworkToken: null,
      isAuthenticated: false,
      setUser: (userId, nickname) =>
        set({ userId, nickname, isAuthenticated: true }),
      setChatworkToken: (token) => set({ chatworkToken: token }),
      logout: () =>
        set({
          userId: null,
          nickname: null,
          chatworkToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'orgchart-user',
    }
  )
);
