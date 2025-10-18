import { create } from 'zustand';

interface AccountStore {
  username: string;
  authenticated: boolean;
  pending: boolean;

  // API base URL
  apiUrl: string;

  authorize: () => Promise<void>;
  requestSignin: (username: string, password: string) => Promise<Number>;
  requestSignup: (username: string, password: string) => Promise<boolean>;
  requestSignout: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useAccountStore = create<AccountStore>((set) => ({
  username: '',
  authenticated: false,
  pending: true,
  apiUrl: API_URL,

  authorize: async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth`, {
        method: 'POST',
        credentials: 'include'
      });
      const json = await response.json();
      if (response.ok) {
        set({
          username: json.username,
          authenticated: true,
          pending: false
        });
      }
      else {
        set({
          pending: false
        });
      }
    } catch (error) {
      console.log('Failed to Authorize: ', error);
      set({
        pending: false
      });
    }
  },
  requestSignin: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          password: password
        }),
        credentials: 'include'
      });

      if (response.ok) {
        set(() => ({
          username: username,
          authenticated: true
        }));
      }

      return response.status;
    } catch (error) {
      console.log('Failed to Sign in: ', error);
      return 500;
    }
  },
  requestSignup: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          password: password
        }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to Sign up');
      //const account = await response.json();

      set(() => ({
        username: username
      }));

      return true;
    } catch (error) {
      console.log('Failed to Sign up: ', error);
      return false;
    }
  },
  requestSignout: async () => {
    try {
      await fetch(`${API_URL}/api/signout`, {
        method: 'POST',
        credentials: 'include'
      });
      set({
        username: '',
        authenticated: false
      });
    }
    catch (error) {
      console.log('Failed to Sign out: ', error);
    }
  }
}));