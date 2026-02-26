import { createSlice } from "@reduxjs/toolkit";

const AUTH_STORAGE_KEY = "campus_cravix_auth";

function loadStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { token: string; user: AuthUser; vendorId?: string | null };
    if (!parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveAuthToStorage(token: string, user: AuthUser, vendorId: string | null) {
  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token, user, vendorId })
    );
  } catch {
    // Ignore storage errors
  }
}

function clearAuthFromStorage() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: "student" | "vendor";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  vendorId: string | null;
}

const stored = loadStoredAuth();
const initialState: AuthState = {
  user: stored?.user ?? null,
  token: stored?.token ?? null,
  vendorId: stored?.vendorId ?? null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: {
        payload: {
          token: string;
          user: AuthUser;
          vendorId?: string | null;
        };
      }
    ) {
      const { token, user, vendorId } = action.payload;
      state.token = token;
      state.user = user;
      state.vendorId = vendorId ?? null;
      saveAuthToStorage(token, user, state.vendorId);
    },
    setVendorId(state, action: { payload: string }) {
      state.vendorId = action.payload;
      if (state.token && state.user) {
        saveAuthToStorage(state.token, state.user, action.payload);
      }
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.vendorId = null;
      clearAuthFromStorage();
    },
  },
});

export const { setCredentials, setVendorId, logout } = authSlice.actions;
export default authSlice.reducer;
