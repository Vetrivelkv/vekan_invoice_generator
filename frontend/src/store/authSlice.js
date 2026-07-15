import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isSuperAdmin: false,
  expiresAt: null,
  isChecking: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isAdmin = ['super_admin', 'admin'].includes(action.payload.role);
      state.isSuperAdmin = action.payload.role === 'super_admin';
      state.expiresAt = action.payload.expiresAt;
      state.isChecking = false;
    },
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isSuperAdmin = false;
      state.expiresAt = null;
      state.isChecking = false;
    },
    finishSessionCheck: (state) => {
      state.isChecking = false;
    },
  },
});

export const { setSession, clearSession, finishSessionCheck } = authSlice.actions;
export default authSlice.reducer;
