import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  gender?: string;
  dob?: string;
  phone?: string;
  budgetTargets?: {
    needs: number;
    wants: number;
    savings: number;
  };
}

export interface UserState {
  profile: User | null;
}

const initialState: UserState = {
  profile: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.profile = action.payload;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    }
  },
});

export const { setUser, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;
