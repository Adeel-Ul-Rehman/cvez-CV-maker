import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  avatarUrl?: string | null;
  provider?: 'email' | 'google' | string;
  cvCount: number;
}

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
};

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res: any = await api.get('/api/auth/me');
    const user = res?.user || (res?.id ? res : res?.data?.user || res?.data);
    if (!user || !user.id) {
      return rejectWithValue('User not authenticated');
    }
    return user as AuthUser;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to fetch user');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/api/auth/logout');
  } catch {
    // Ignore logout network failure, clean local state
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = 'succeeded';
      state.initialized = true;
    },
    updateUserProfile(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.initialized = true;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = 'failed';
        state.user = null;
        state.initialized = true;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.initialized = true;
      });
  },
});

export const { setUser, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
