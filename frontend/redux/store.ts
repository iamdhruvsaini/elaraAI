import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./services/authentication/authService";
import { profileApi } from "./services/profile/profileService";
import { vanityApi } from "./services/vanity/vanityService";
import { makeupApi } from "./services/makeup/makeupService";
import makeupSessionReducer from "./services/makeup/makeupSlice";


export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [vanityApi.reducerPath]: vanityApi.reducer,
    [makeupApi.reducerPath]: makeupApi.reducer,
    makeupSession: makeupSessionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      profileApi.middleware,
      vanityApi.middleware,
      makeupApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
