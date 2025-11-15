import { createSlice } from '@reduxjs/toolkit';

// Try loading from localStorage for persistence (guard for SSR and malformed data)
let savedUser = null;
let savedToken = null;

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const rawUser = localStorage.getItem('user');
    savedUser = rawUser ? JSON.parse(rawUser) : null;
  } catch (e) {
    // If parsing fails, clear the corrupt value
    try { localStorage.removeItem('user'); } catch (_) {}
    savedUser = null;
  }
  try {
    savedToken = localStorage.getItem('token') || null;
  } catch (e) {
    savedToken = null;
  }
}

const initialState = {
  user: savedUser || null,
  token: savedToken || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;

      // Clear from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

// Export the actions and the reducer
export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
