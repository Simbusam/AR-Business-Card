import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';  // Adjust the path as necessary

// Set up the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,  // Add the auth reducer to the store
  },
});
