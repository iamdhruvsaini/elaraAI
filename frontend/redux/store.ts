import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./services/authentication/authService";
import { profileApi } from "./services/profile/profileService";
import { vanityApi } from "./services/vanity/vanityService";


export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [vanityApi.reducerPath]: vanityApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, profileApi.middleware, vanityApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
