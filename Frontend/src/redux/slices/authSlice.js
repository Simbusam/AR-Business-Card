import { createSlice } from '@reduxjs/toolkit';

// Try loading from localStorage for persistence
const savedUser = JSON.parse(localStorage.getItem('user'));
const savedToken = localStorage.getItem('token');

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
